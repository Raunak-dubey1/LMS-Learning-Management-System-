import express from 'express';

import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('student'), async (req, res) => {
  const { courseId, rating, comment } = req.body;

  if (!courseId || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Course, rating, and comment are required' });
  }

  const enrolled = await Enrollment.findOne({ student: req.user.id, course: courseId });
  if (!enrolled) {
    return res.status(403).json({ success: false, message: 'You must enroll before reviewing this course' });
  }

  const passedQuiz = await QuizAttempt.exists({ student: req.user.id, course: courseId, status: 'PASSED' });
  if (enrolled.progress < 100 || enrolled.status !== 'completed' || !passedQuiz) {
    return res.status(400).json({ success: false, message: 'Complete the course and pass a quiz before submitting a review' });
  }

  const alreadyReviewed = await Review.findOne({ student: req.user.id, course: courseId });
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: 'You have already reviewed this course' });
  }

  const review = await Review.create({
    student: req.user.id,
    course: courseId,
    rating: Number(rating),
    comment,
  });

  const courseReviews = await Review.find({ course: courseId });
  const course = await Course.findById(courseId);
  if (course && courseReviews.length) {
    course.rating = Number((courseReviews.reduce((sum, item) => sum + item.rating, 0) / courseReviews.length).toFixed(1));
    await course.save();
  }

  return res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review,
  });
});

router.get('/course/:courseId', protect, async (req, res) => {
  const courseReviews = await Review.find({ course: req.params.courseId, status: 'published' }).populate('student', 'name email');
  return res.status(200).json({ success: true, data: courseReviews });
});

export default router;
