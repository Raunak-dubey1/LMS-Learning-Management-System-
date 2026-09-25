import express from 'express';

import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Review from '../models/Review.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorize('admin'));

const audit = (admin, action, targetType, targetId, reason = '') =>
  AuditLog.create({ admin, action, targetType, targetId, reason });

router.get('/dashboard', async (_req, res) => {
  const [userStats, courseStats, enrollments, completedCourses, quizStats, reviewStats, pendingInstructors] = await Promise.all([
    User.aggregate([{ $group: { _id: { role: '$role', status: '$status' }, count: { $sum: 1 } } }]),
    Course.aggregate([{ $group: { _id: { $ifNull: ['$moderationStatus', { $cond: ['$published', 'published', 'draft'] }] }, count: { $sum: 1 } } }]),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: 'completed' }),
    QuizAttempt.aggregate([{ $group: { _id: null, attempts: { $sum: 1 }, averageScore: { $avg: '$score' } } }]),
    Review.aggregate([{ $group: { _id: null, total: { $sum: 1 }, averageRating: { $avg: '$rating' } } }]),
    User.countDocuments({ role: 'instructor', status: 'pending' }),
  ]);

  const users = { students: 0, instructors: 0, admins: 0, pending: pendingInstructors, suspended: 0 };
  userStats.forEach(({ _id, count }) => {
    if (_id.role === 'student') users.students += count;
    if (_id.role === 'instructor') users.instructors += count;
    if (_id.role === 'admin') users.admins += count;
    if (_id.status === 'suspended') users.suspended += count;
  });

  const courses = { published: 0, draft: 0, pendingReview: 0, rejected: 0, archived: 0 };
  courseStats.forEach(({ _id, count }) => {
    if (_id === 'published') courses.published = count;
    if (_id === 'draft') courses.draft = count;
    if (_id === 'pending_review') courses.pendingReview = count;
    if (_id === 'rejected') courses.rejected = count;
    if (_id === 'archived') courses.archived = count;
  });

  return res.json({
    success: true,
    dashboard: {
      users,
      courses,
      learning: { enrollments, completedCourses },
      quizzes: { attempts: quizStats[0]?.attempts || 0, averageScore: Math.round(quizStats[0]?.averageScore || 0) },
      reviews: { total: reviewStats[0]?.total || 0, averageRating: Number((reviewStats[0]?.averageRating || 0).toFixed(1)) },
    },
  });
});

router.get('/users', async (req, res) => {
  const { role, status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const [users, total] = await Promise.all([
    User.find(query).select('-password -passwordResetToken -passwordResetExpires').sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    User.countDocuments(query),
  ]);
  return res.json({ success: true, data: users.map((user) => ({ ...user.toObject(), status: user.status || 'active' })), pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
});

router.patch('/users/:id/status', async (req, res) => {
  const { status, reason = '' } = req.body;
  if (!['active', 'suspended', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid user status' });
  if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'You cannot change your own status' });
  const target = await User.findById(req.params.id).select('role');
  if (target?.role === 'admin') return res.status(403).json({ success: false, message: 'Admin accounts require separate administrative control' });
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await audit(req.user.id, `USER_${status.toUpperCase()}`, 'User', user._id, reason);
  return res.json({ success: true, message: `User ${status}`, user });
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['student', 'instructor'].includes(role)) return res.status(400).json({ success: false, message: 'Only student and instructor roles can be assigned here' });
  const target = await User.findById(req.params.id).select('role');
  if (target?.role === 'admin') return res.status(403).json({ success: false, message: 'Admin accounts require separate administrative control' });
  const user = await User.findByIdAndUpdate(req.params.id, { role, status: role === 'instructor' ? 'pending' : 'active' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await audit(req.user.id, 'CHANGE_USER_ROLE', 'User', user._id, `Changed role to ${role}`);
  return res.json({ success: true, user });
});

router.get('/instructors/pending', async (_req, res) => {
  const users = await User.find({ role: 'instructor', status: 'pending' }).select('-password').sort({ createdAt: 1 });
  return res.json({ success: true, data: users });
});

router.patch('/instructors/:id/approve', async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'instructor' }, { status: 'active' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'Pending instructor not found' });
  await audit(req.user.id, 'APPROVE_INSTRUCTOR', 'User', user._id);
  return res.json({ success: true, message: 'Instructor approved', user });
});

router.patch('/instructors/:id/reject', async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'instructor' }, { status: 'rejected' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'Instructor not found' });
  await audit(req.user.id, 'REJECT_INSTRUCTOR', 'User', user._id, req.body.reason || 'Application rejected');
  return res.json({ success: true, message: 'Instructor rejected', user });
});

router.get('/courses', async (req, res) => {
  const query = req.query.status ? { moderationStatus: req.query.status } : {};
  const courses = await Course.find(query).populate('instructor', 'name email').sort({ createdAt: -1 }).lean();
  const data = await Promise.all(courses.map(async (course) => ({ ...course, students: await Enrollment.countDocuments({ course: course._id }) })));
  return res.json({ success: true, data });
});

router.patch('/courses/:id/status', async (req, res) => {
  const { status, reason = '' } = req.body;
  const allowed = ['draft', 'pending_review', 'published', 'rejected', 'unpublished', 'archived'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid course status' });
  const course = await Course.findByIdAndUpdate(req.params.id, { moderationStatus: status, published: status === 'published' }, { new: true });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  await audit(req.user.id, `COURSE_${status.toUpperCase()}`, 'Course', course._id, reason);
  return res.json({ success: true, message: `Course ${status}`, course });
});

router.delete('/courses/:id', async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, { moderationStatus: 'archived', published: false }, { new: true });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  await audit(req.user.id, 'ARCHIVE_COURSE', 'Course', course._id, req.body.reason || 'Archived by admin');
  return res.json({ success: true, message: 'Course archived' });
});

router.get('/analytics', async (_req, res) => {
  const [popularCourses, categories, quizPerformance] = await Promise.all([
    Enrollment.aggregate([
      { $group: { _id: '$course', enrollments: { $sum: 1 } } },
      { $sort: { enrollments: -1 } }, { $limit: 10 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' }, { $project: { title: '$course.title', enrollments: 1 } },
    ]),
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' }, { $group: { _id: '$course.category', enrollments: { $sum: 1 } } }, { $sort: { enrollments: -1 } },
    ]),
    QuizAttempt.aggregate([{ $lookup: { from: 'quizsessions', localField: 'quiz', foreignField: '_id', as: 'quiz' } }, { $unwind: { path: '$quiz', preserveNullAndEmptyArrays: true } }, { $group: { _id: '$quiz.subject', averageScore: { $avg: '$score' } } }, { $sort: { averageScore: -1 } }]),
  ]);
  return res.json({ success: true, analytics: { popularCourses, categories, quizPerformance } });
});

router.get('/courses/:id/analytics', async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name email');
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  const [enrollments, completed, quizStats, reviews] = await Promise.all([
    Enrollment.countDocuments({ course: course._id }),
    Enrollment.countDocuments({ course: course._id, status: 'completed' }),
    QuizAttempt.aggregate([{ $match: { course: course._id } }, { $group: { _id: null, averageScore: { $avg: '$score' }, attempts: { $sum: 1 } } }]),
    Review.find({ course: course._id, status: { $ne: 'hidden' } }),
  ]);
  return res.json({ success: true, analytics: {
    course: { id: course._id, title: course.title, instructor: course.instructor },
    students: enrollments,
    completion: enrollments ? Math.round((completed / enrollments) * 100) : 0,
    quizAverage: Math.round(quizStats[0]?.averageScore || 0),
    quizAttempts: quizStats[0]?.attempts || 0,
    reviews: reviews.length,
    rating: reviews.length ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)) : 0,
  } });
});

router.get('/categories', async (_req, res) => {
  return res.json({ success: true, data: await Category.find().sort({ name: 1 }) });
});

router.post('/categories', async (req, res) => {
  const category = await Category.create({ name: req.body.name });
  await audit(req.user.id, 'CREATE_CATEGORY', 'Category', category._id);
  return res.status(201).json({ success: true, category });
});

router.put('/categories/:id', async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  await audit(req.user.id, 'UPDATE_CATEGORY', 'Category', category._id);
  return res.json({ success: true, category });
});

router.delete('/categories/:id', async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  await audit(req.user.id, 'DEACTIVATE_CATEGORY', 'Category', category._id);
  return res.json({ success: true, message: 'Category deactivated' });
});

router.get('/reviews', async (req, res) => {
  const query = req.query.status ? { status: req.query.status } : {};
  return res.json({ success: true, data: await Review.find(query).populate('student', 'name email').populate('course', 'title').sort({ createdAt: -1 }) });
});

router.patch('/reviews/:id/status', async (req, res) => {
  if (!['published', 'reported', 'hidden'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid review status' });
  const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  await audit(req.user.id, `REVIEW_${req.body.status.toUpperCase()}`, 'Review', review._id, req.body.reason || 'Review moderation');
  return res.json({ success: true, message: `Review ${req.body.status}`, review });
});

router.get('/audit-logs', async (req, res) => {
  const logs = await AuditLog.find().populate('admin', 'name email').sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 50, 200));
  return res.json({ success: true, data: logs });
});

export default router;
