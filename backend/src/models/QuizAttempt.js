import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSession' },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['PASSED', 'FAILED'], default: 'FAILED' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('QuizAttempt', quizAttemptSchema);
