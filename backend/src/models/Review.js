import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    status: { type: String, enum: ['published', 'reported', 'hidden'], default: 'published' },
  },
  { timestamps: true }
);

reviewSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
