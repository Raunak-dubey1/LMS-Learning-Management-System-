import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import User from "../models/User.js";

const router = express.Router();

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return process.env.JWT_SECRET;
};

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    getJwtSecret(),
    {
      expiresIn: "7d",
    },
  );

router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    role = "student",
    instructorExperience = "",
  } = req.body;

  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message:
        "Name, email, and a password of at least 8 characters are required",
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res
      .status(409)
      .json({ success: false, message: "User already exists with this email" });
  }

  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 10),
    role: role === "instructor" ? "instructor" : "student",
    status: role === "instructor" ? "pending" : "active",
    instructorExperience: role === "instructor" ? instructorExperience : "",
  });

  if (newUser.status !== "active") {
    return res.status(201).json({
      success: true,
      message: "Instructor application submitted for admin approval",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  }

  const token = signToken(newUser);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
    },
  });
});

router.post("/forgot-password", async (req, res) => {
  const user = await User.findOne({
    email: String(req.body.email || "").toLowerCase(),
  });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
  }
  return res.status(200).json({
    success: true,
    message: "If the email exists, reset instructions have been created",
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = token
    ? crypto.createHash("sha256").update(token).digest("hex")
    : "";
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user || !password || password.length < 8)
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired reset token" });
  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
  return res
    .status(200)
    .json({ success: true, message: "Password reset successfully" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  if (user.status && user.status !== "active") {
    return res
      .status(403)
      .json({ success: false, message: `Account is ${user.status}` });
  }

  const token = signToken(user);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || "active",
    },
  });
});

export default router;
