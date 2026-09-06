import "dotenv/config";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import multer from "multer";
import File from "./models/File.js";
import User from "./models/User.js";
import {
  createToken,
  requireAdmin,
  requireAuth,
  serializeUser,
} from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalClient = /^http:\/\/localhost:\d+$/.test(origin || "");
      if (!origin || origin === clientUrl || isLocalClient) {
        return callback(null, true);
      }
      callback(new Error("Origin is not allowed by CORS."));
    },
  }),
);
app.use(express.json());

app.post("/api/auth/signup", async (request, response, next) => {
  try {
    const { name, email, password } = request.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return response
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }
    if (password.length < 8) {
      return response
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return response
        .status(409)
        .json({ message: "An account with that email already exists." });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
    });
    response
      .status(201)
      .json({ user: serializeUser(user), token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return response
        .status(401)
        .json({ message: "Email or password is incorrect." });
    }
    response.json({ user: serializeUser(user), token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, (request, response) => {
  response.json(serializeUser(request.user));
});

app.patch("/api/auth/profile", requireAuth, async (request, response, next) => {
  try {
    const { name, email, jobRole } = request.body;
    if (!name?.trim() || !email?.trim())
      return response
        .status(400)
        .json({ message: "Name and email are required." });

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: request.user._id },
    });
    if (existingUser)
      return response
        .status(409)
        .json({ message: "That email is already in use." });

    request.user.name = name.trim();
    request.user.email = normalizedEmail;
    request.user.jobRole = jobRole?.trim() || "";
    await request.user.save();
    response.json(serializeUser(request.user));
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/users",
  requireAuth,
  requireAdmin,
  async (_request, response, next) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      response.json(users.map(serializeUser));
    } catch (error) {
      next(error);
    }
  },
);

app.patch(
  "/api/users/:id/role",
  requireAuth,
  requireAdmin,
  async (request, response, next) => {
    try {
      const { role } = request.body;
      if (!["user", "admin"].includes(role))
        return response.status(400).json({ message: "Choose a valid role." });
      if (request.params.id === request.user.id && role !== "admin")
        return response
          .status(400)
          .json({ message: "You cannot remove your own admin role." });

      const user = await User.findByIdAndUpdate(
        request.params.id,
        { role },
        { new: true, runValidators: true },
      );
      if (!user)
        return response.status(404).json({ message: "User not found." });
      response.json(serializeUser(user));
    } catch (error) {
      next(error);
    }
  },
);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const serializeFile = (file) => ({
  id: file._id,
  name: file.originalName,
  type: file.mimeType,
  size: file.size,
  downloads: file.downloads,
  createdAt: file.createdAt,
  shareToken: file.shareToken,
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/files", requireAuth, async (request, response, next) => {
  try {
    const files = await File.find({ owner: request.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    response.json(files.map(serializeFile));
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/files",
  requireAuth,
  upload.single("file"),
  async (request, response, next) => {
    if (!request.file) {
      return response.status(400).json({ message: "Choose a file to upload." });
    }

    try {
      const file = await File.create({
        owner: request.user._id,
        originalName: request.file.originalname,
        storedName: request.file.filename,
        mimeType: request.file.mimetype,
        size: request.file.size,
        shareToken: crypto.randomBytes(12).toString("hex"),
      });

      response.status(201).json(serializeFile(file));
    } catch (error) {
      fs.rmSync(request.file.path, { force: true });
      next(error);
    }
  },
);

app.get("/api/files/:id/download", async (request, response, next) => {
  try {
    const file = await File.findById(request.params.id);
    if (!file) return response.status(404).json({ message: "File not found." });

    const filePath = path.join(uploadDirectory, file.storedName);
    if (!fs.existsSync(filePath))
      return response.status(404).json({ message: "Stored file is missing." });

    if (request.query.preview === "1") {
      response.type(file.mimeType || "application/octet-stream");
      return response.sendFile(filePath);
    }
    await File.updateOne({ _id: file.id }, { $inc: { downloads: 1 } });
    response.download(filePath, file.originalName);
  } catch (error) {
    next(error);
  }
});

app.get("/api/share/:token", async (request, response, next) => {
  try {
    const file = await File.findOne({ shareToken: request.params.token });
    if (!file)
      return response.status(404).json({ message: "Share link not found." });
    response.json(serializeFile(file));
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return response
      .status(413)
      .json({ message: "Files must be smaller than 100 MB." });
  }
  console.error(error);
  response.status(500).json({ message: "Something went wrong on the server." });
});

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dropvault")
  .then(() => {
    app.listen(port, () =>
      console.log(`DropVault API running on http://localhost:${port}`),
    );
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
