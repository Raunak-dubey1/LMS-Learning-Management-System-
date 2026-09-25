import express from 'express';

import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const { search = '', category = '', level = '', sort = 'rating', page = 1, limit = 10 } = req.query;

  const query = { published: true, $or: [{ moderationStatus: 'published' }, { moderationStatus: { $exists: false } }] };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  if (level) query.level = level;

  const sortOptions = {
    price: { price: 1 },
    title: { title: 1 },
    rating: { rating: -1 },
    popularity: { createdAt: -1 },
  };

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const total = await Course.countDocuments(query);
  const rawCourses = await Course.find(query)
    .populate('instructor', 'name')
    .sort(sort === 'popularity' ? {} : (sortOptions[sort] || sortOptions.rating))
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();
  const courses = await Promise.all(rawCourses.map(async (course) => ({
    ...course,
    students: await Enrollment.countDocuments({ course: course._id }),
  })));
  if (sort === 'popularity') courses.sort((first, second) => second.students - first.students);

  return res.status(200).json({
    success: true,
    data: courses,
    pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    user: req.user,
  });
});

router.get('/:courseId', protect, async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId).populate('instructor', 'name email');

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const enrollment = req.user.role === 'student'
    ? await Enrollment.findOne({ student: req.user.id, course: courseId }).select('status progress completedLessons')
    : null;
  const publicCourse = course.toObject();
  publicCourse.instructor = course.instructor;
  publicCourse.students = await Enrollment.countDocuments({ course: courseId });
  publicCourse.enrollment = enrollment;
  if (!enrollment) {
    publicCourse.sections = (publicCourse.sections || []).map((section) => ({
      ...section,
      lessons: (section.lessons || []).map(({ _id, title }) => ({ _id, title })),
    }));
  }

  return res.status(200).json({ success: true, course: publicCourse });
});

router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  const { title, description, category, level, price = 0, sections = [], published = false } = req.body;

  if (!title || !description || !category || !level) {
    return res.status(400).json({ success: false, message: 'Course details are incomplete' });
  }

  const course = await Course.create({
    title,
    description,
    category,
    level,
    price,
    rating: 4.5,
    published,
    instructor: req.user.id,
    sections: sections.map((section, index) => ({
      title: section.title || `Section ${index + 1}`,
      lessons: (section.lessons || []).map((lesson, lessonIndex) => ({
        title: lesson.title || `Lesson ${lessonIndex + 1}`,
        content: lesson.content || 'Lesson content goes here.',
      })),
    })),
  });

  return res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course,
  });
});

router.patch('/:courseId', protect, authorize('instructor', 'admin'), async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (req.user.role === 'instructor' && course.instructor?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only edit your own courses' });
  }

  const { title, description, category, level, price, sections } = req.body;
  Object.assign(course, {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(category !== undefined && { category }),
    ...(level !== undefined && { level }),
    ...(price !== undefined && { price }),
    ...(sections !== undefined && { sections }),
  });
  await course.save();

  return res.status(200).json({ success: true, message: 'Course updated successfully', course });
});

router.patch('/:courseId/publish', protect, authorize('instructor', 'admin'), async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (req.user.role === 'instructor' && course.instructor?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only publish your own courses' });
  }

  if (req.user.role === 'admin') {
    course.published = Boolean(req.body.published);
    course.moderationStatus = course.published ? 'published' : 'unpublished';
  } else if (req.body.published) {
    course.published = false;
    course.moderationStatus = 'pending_review';
  } else {
    course.published = false;
    course.moderationStatus = 'draft';
  }
  await course.save();

  return res.status(200).json({
    success: true,
    message: req.user.role === 'admin'
      ? (course.published ? 'Course published' : 'Course unpublished')
      : (course.moderationStatus === 'pending_review' ? 'Course submitted for admin review' : 'Course saved as draft'),
    course,
  });
});

router.post('/:courseId/enroll', protect, authorize('student'), async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (!course.published) {
    return res.status(400).json({ success: false, message: 'Course is not published yet' });
  }

  const existing = await Enrollment.findOne({ student: req.user.id, course: courseId });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Student is already enrolled in this course' });
  }

  const enrollment = await Enrollment.create({
    student: req.user.id,
    course: courseId,
    status: 'active',
    progress: 0,
    completedLessons: [],
  });

  return res.status(200).json({
    success: true,
    message: `Student enrolled in course ${courseId}`,
    enrollment,
  });
});

export default router;
