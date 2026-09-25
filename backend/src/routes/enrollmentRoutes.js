import express from 'express';

import Enrollment from '../models/Enrollment.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-courses', protect, authorize('student'), async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).populate('course');
  const myCourses = enrollments.map((enrollment) => ({
    courseId: enrollment.course?._id,
    title: enrollment.course?.title,
    progress: enrollment.progress,
    category: enrollment.course?.category,
    level: enrollment.course?.level,
  }));

  return res.status(200).json({
    success: true,
    data: myCourses,
    student: req.user.id,
  });
});

router.get('/all', protect, authorize('admin', 'instructor'), async (req, res) => {
  const allEnrollments = await Enrollment.find().populate('student', 'name email').populate('course', 'title');

  return res.status(200).json({ success: true, data: allEnrollments });
});

export default router;
