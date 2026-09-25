import express from 'express';

import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, authorize('student'), async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Course ID is required' });
  }

  const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
  if (!enrollment) {
    return res.status(404).json({ success: false, message: 'Enrollment not found for this course' });
  }

  const passedQuiz = await QuizAttempt.exists({ student: req.user.id, course: courseId, status: 'PASSED' });
  if (enrollment.progress < 100 || !passedQuiz) {
    return res.status(400).json({ success: false, message: 'Complete all lessons and pass a quiz before generating a certificate' });
  }

  const existingCertificate = await Certificate.findOne({ student: req.user.id, course: courseId });
  if (existingCertificate) {
    return res.status(400).json({ success: false, message: 'Certificate already exists for this course' });
  }

  const certificate = await Certificate.create({
    certificateId: `CERT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    student: req.user.id,
    course: courseId,
  });

  await Certificate.populate(certificate, [
    { path: 'student', select: 'name email' },
    { path: 'course', select: 'title instructor', populate: { path: 'instructor', select: 'name' } },
  ]);

  return res.status(201).json({ success: true, certificate });
});

router.get('/:certificateId', async (req, res) => {
  const certificate = await Certificate.findOne({ certificateId: req.params.certificateId });

  if (!certificate) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  return res.status(200).json({ success: true, certificate, valid: true });
});

router.get('/', protect, authorize('student'), async (req, res) => {
  const certificates = await Certificate.find({ student: req.user.id })
    .populate('course', 'title instructor')
    .populate('student', 'name email')
    .sort({ issuedAt: -1 });
  return res.status(200).json({ success: true, data: certificates });
});

export default router;
