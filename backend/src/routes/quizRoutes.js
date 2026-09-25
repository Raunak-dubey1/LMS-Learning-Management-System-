import express from 'express';

import QuizSession from '../models/QuizSession.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Enrollment from '../models/Enrollment.js';
import { fetchQuizQuestions, computeQuizResult } from '../services/quizService.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const fallbackQuestions = (subject, difficulty, amount) => [
  {
    questionId: 'q1',
    question: `Which statement is correct about ${subject}?`,
    options: ['It is a database', 'It is a JavaScript topic', 'It is a CSS property', 'It is a server command'],
    correctAnswer: 'It is a JavaScript topic',
  },
  {
    questionId: 'q2',
    question: `What is the typical difficulty level for ${subject}?`,
    options: ['Very low', 'Medium', 'High only', 'None at all'],
    correctAnswer: 'Medium',
  },
  {
    questionId: 'q3',
    question: `Which option best matches a ${difficulty} level course topic?`,
    options: ['Basic overview', 'Intermediate practice', 'No learning needed', 'Random guesses'],
    correctAnswer: 'Intermediate practice',
  },
].slice(0, Math.max(1, Number(amount) || 3));

router.post('/generate', protect, authorize('student'), async (req, res) => {
  const { subject, difficulty = 'medium', amount = 10, courseId = null } = req.body;

  if (!subject) {
    return res.status(400).json({ success: false, message: 'Subject is required' });
  }

  if (courseId) {
    const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in the course before starting its quiz' });
  }

  const previousAttempts = courseId
    ? await QuizAttempt.countDocuments({ student: req.user.id, course: courseId })
    : 0;
  if (previousAttempts >= 3) return res.status(400).json({ success: false, message: 'Maximum quiz attempts reached for this course' });

  let questionSet;
  const hasQuizApiKey = process.env.QUIZ_API_KEY && !process.env.QUIZ_API_KEY.startsWith('your_');
  try {
    questionSet = hasQuizApiKey
      ? await fetchQuizQuestions({ subject, difficulty, amount, apiClient: { get: async (url) => ({ data: await fetch(url).then((response) => response.json()) }) } })
      : fallbackQuestions(subject, difficulty, amount);
  } catch (error) {
    if (process.env.QUIZ_API_FALLBACK === 'false') return res.status(502).json({ success: false, message: `Quiz service unavailable: ${error.message}` });
    questionSet = fallbackQuestions(subject, difficulty, amount);
  }
  const quiz = await QuizSession.create({
    student: req.user.id,
    course: courseId,
    subject,
    difficulty,
    amount: questionSet.length,
    questions: questionSet,
    status: 'in_progress',
    score: null,
  });

  return res.status(200).json({
    success: true,
    quizId: quiz._id,
    subject,
    difficulty,
    amount: quiz.amount,
    questions: questionSet.map(({ questionId, question, options }) => ({ questionId, question, options })),
  });
});

router.post('/:quizId/submit', protect, authorize('student'), async (req, res) => {
  const { quizId } = req.params;
  const { answers = {} } = req.body;

  const quiz = await QuizSession.findOne({ _id: quizId, student: req.user.id });
  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz session not found' });
  }

  if (quiz.status === 'completed') return res.status(400).json({ success: false, message: 'This quiz has already been submitted' });

  const result = computeQuizResult(
    answers,
    Object.fromEntries(quiz.questions.map((question) => [question.questionId, question.correctAnswer]))
  );

  quiz.status = 'completed';
  quiz.score = result.score;
  await quiz.save();

  await QuizAttempt.create({
    student: req.user.id,
    course: quiz.course,
    quiz: quiz._id,
    score: result.score,
    status: result.status,
  });

  if (quiz.course && result.status === 'PASSED') {
    const enrollment = await Enrollment.findOne({ student: req.user.id, course: quiz.course });
    if (enrollment && enrollment.progress >= 100) {
      enrollment.status = 'completed';
      await enrollment.save();
    }
  }

  return res.status(200).json({
    success: true,
    quizId,
    ...result,
  });
});

router.get('/attempts', protect, authorize('student'), async (req, res) => {
  const attempts = await QuizAttempt.find({ student: req.user.id }).populate('course', 'title').sort({ submittedAt: -1 });
  return res.status(200).json({ success: true, data: attempts });
});

export default router;
