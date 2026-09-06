import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true, unique: true },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, required: true },
    shareToken: { type: String, required: true, unique: true },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("File", fileSchema);
