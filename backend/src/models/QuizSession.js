import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
  },
  { _id: false }
);

const quizSessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    subject: { type: String, required: true },
    difficulty: { type: String, default: 'medium' },
    amount: { type: Number, default: 10 },
    questions: [answerSchema],
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    score: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('QuizSession', quizSessionSchema);
