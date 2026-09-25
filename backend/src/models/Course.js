import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    lessons: [lessonSchema],
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: String, required: true },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    published: { type: Boolean, default: true },
    moderationStatus: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'rejected', 'unpublished', 'archived'],
      default: 'draft',
    },
    sections: [sectionSchema],
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
