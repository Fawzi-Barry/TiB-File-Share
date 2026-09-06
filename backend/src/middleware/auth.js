import jwt from "jsonwebtoken";
import User from "../models/User.js";

const jwtSecret = process.env.JWT_SECRET || "development-only-change-me";

export const createToken = (user) =>
  jwt.sign({ userId: user._id.toString() }, jwtSecret, { expiresIn: "7d" });

export const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || "user",
  jobRole: user.jobRole || "",
  createdAt: user.createdAt,
});

export const requireAuth = async (request, response, next) => {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token)
    return response.status(401).json({ message: "Sign in to continue." });

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId);
    if (!user)
      return response
        .status(401)
        .json({ message: "Your session is no longer valid." });
    request.user = user;
    next();
  } catch {
    response.status(401).json({ message: "Your session is no longer valid." });
  }
};

export const requireAdmin = (request, response, next) => {
  if (request.user?.role !== "admin")
    return response.status(403).json({ message: "Admin access is required." });
  next();
};
