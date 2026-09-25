import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  await connectDB();
  const email = String(process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'System Admin';

  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin' || existing.status !== 'active') {
      existing.role = 'admin';
      existing.status = 'active';
      await existing.save();
    }
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await User.create({ name, email, password: await bcrypt.hash(password, 12), role: 'admin', status: 'active' });
  console.log(`Admin created: ${email}`);
  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error('Admin seed failed:', error.message);
  process.exit(1);
});
