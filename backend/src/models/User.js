import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'suspended'],
      default: 'active',
    },
    instructorExperience: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
