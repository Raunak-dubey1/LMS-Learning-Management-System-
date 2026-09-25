import express from 'express';

import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/lesson/:lessonId/complete', protect, authorize('student'), async (req, res) => {
  const { lessonId } = req.params;
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Course ID is required to mark a lesson complete' });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
  if (!enrollment) {
    return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
  }

  const lessonExists = (course.sections || []).some((section) =>
    (section.lessons || []).some((lesson) => lesson._id.toString() === lessonId)
  );

  if (!lessonExists) {
    return res.status(404).json({ success: false, message: 'Lesson does not belong to this course' });
  }

  if (!enrollment.completedLessons.includes(lessonId)) {
    enrollment.completedLessons.push(lessonId);
  }

  const allLessons = (course.sections || []).flatMap((section) => section.lessons || []);
  const completedCount = enrollment.completedLessons.filter((item) =>
    allLessons.some((lesson) => lesson._id.toString() === item)
  ).length;

  enrollment.progress = Math.round((completedCount / allLessons.length) * 100) || 0;
  enrollment.status = enrollment.progress >= 100 ? 'completed' : 'active';
  await enrollment.save();

  return res.status(200).json({
    success: true,
    message: `Lesson ${lessonId} marked as complete`,
    progress: enrollment.progress,
    completedLessons: enrollment.completedLessons,
  });
});

router.get('/summary', protect, authorize('student'), async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).populate('course');

  const sections = enrollments.map((enrollment) => ({
    course: enrollment.course?.title || 'Unknown Course',
    progress: enrollment.progress,
  }));

  const overallProgress = sections.length
    ? Math.round(sections.reduce((sum, item) => sum + item.progress, 0) / sections.length)
    : 0;

  return res.status(200).json({
    success: true,
    summary: {
      overallProgress,
      sections,
    },
  });
});

router.get('/:courseId', protect, authorize('student'), async (req, res) => {
  const enrollment = await Enrollment.findOne({ student: req.user.id, course: req.params.courseId }).populate('course', 'title sections');
  if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
  return res.status(200).json({
    success: true,
    progress: {
      course: enrollment.course?.title,
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons,
      status: enrollment.status,
    },
  });
});

export default router;
