import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      (process.env.NODE_ENV === "production"
        ? null
        : "mongodb://127.0.0.1:27017/lms_db");
    if (!mongoUri) throw new Error("MONGO_URI is required in production");
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
