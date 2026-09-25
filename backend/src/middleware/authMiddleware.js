import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return process.env.JWT_SECRET;
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select(
      "_id email role status",
    );
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User account not found" });
    const status = user.status || "active";
    if (status === "suspended")
      return res
        .status(403)
        .json({ success: false, message: "Your account is suspended" });
    if (status !== "active")
      return res
        .status(403)
        .json({ success: false, message: "Your account is not active" });
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status,
    };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userRole = req.user.role;
    const isAllowed =
      allowedRoles.includes(userRole) || req.user.role === "admin";

    if (!isAllowed) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied for this role" });
    }

    next();
  };
