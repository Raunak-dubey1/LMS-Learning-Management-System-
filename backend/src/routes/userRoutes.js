import express from 'express';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Review from '../models/Review.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

router.patch('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (req.body.name) user.name = req.body.name.trim();
  if (req.body.email) user.email = req.body.email.toLowerCase().trim();
  await user.save();
  return res.status(200).json({ success: true, message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

router.patch('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user || !currentPassword || !newPassword || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ success: false, message: 'Current password is invalid' });
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.status(200).json({ success: true, message: 'Password changed successfully' });
});

router.get('/dashboard', protect, authorize('admin', 'instructor', 'student'), async (req, res) => {
  if (req.user.role === 'student') {
    const studentEnrollments = await Enrollment.find({ student: req.user.id }).populate('course');
    const attempts = await QuizAttempt.find({ student: req.user.id });
    const averageScore = attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
      : 0;

    return res.status(200).json({
      success: true,
      role: req.user.role,
      dashboard: {
        enrolledCourses: studentEnrollments.length,
        averageScore,
        bestSubject: 'React',
        myCourses: studentEnrollments.map((enrollment) => ({
          courseId: enrollment.course?._id,
          title: enrollment.course?.title,
          progress: enrollment.progress,
        })),
      },
    });
  }

  if (req.user.role === 'instructor') {
    const courses = await Course.find({ instructor: req.user.id }).sort({ createdAt: -1 });
    const courseIds = courses.map((course) => course._id);
    const enrollments = await Enrollment.find({ course: { $in: courseIds } }).populate('student', 'name email');
    const attempts = await QuizAttempt.find({ course: { $in: courseIds } });
    const reviews = await Review.find({ course: { $in: courseIds } }).populate('student', 'name email').populate('course', 'title');
    const averageCompletion = enrollments.length
      ? Math.round(enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / enrollments.length)
      : 0;
    const averageQuizScore = attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
      : 0;
    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      role: req.user.role,
      dashboard: {
        myCourses: courses.map((course) => {
          const courseEnrollments = enrollments.filter((enrollment) => enrollment.course.toString() === course._id.toString());
          const courseReviews = reviews.filter((review) => review.course._id.toString() === course._id.toString());
          return {
            ...course.toObject(),
            enrolledStudents: courseEnrollments.length,
            completion: courseEnrollments.length
              ? Math.round(courseEnrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / courseEnrollments.length)
              : 0,
            rating: courseReviews.length
              ? Number((courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length).toFixed(1))
              : 0,
          };
        }),
        students: enrollments.map((enrollment) => ({
          id: enrollment.student?._id,
          name: enrollment.student?.name,
          email: enrollment.student?.email,
          course: courses.find((course) => course._id.toString() === enrollment.course.toString())?.title,
          progress: enrollment.progress,
          status: enrollment.status,
        })),
        reviews,
        analytics: {
          enrollments: enrollments.length,
          completion: averageCompletion,
          avgQuizScore: averageQuizScore,
          rating: averageRating,
        },
      },
    });
  }

  const allUsers = await User.countDocuments();
  const studentUsers = await User.countDocuments({ role: 'student' });
  const instructorUsers = await User.countDocuments({ role: 'instructor' });
  const courseCount = await Course.countDocuments();
  const enrollmentCount = await Enrollment.countDocuments();

  return res.status(200).json({
    success: true,
    role: req.user.role,
    dashboard: {
      users: allUsers,
      students: studentUsers,
      instructors: instructorUsers,
      courses: courseCount,
      enrollments: enrollmentCount,
    },
  });
});

export default router;
