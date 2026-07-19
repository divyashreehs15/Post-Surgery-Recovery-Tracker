import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  pinned: { type: Boolean, default: false },
  priority: { type: String, enum: ["normal", "high", "important"], default: "normal" }, // ✅ add "high"
  createdAt: { type: Date, default: Date.now }
});

export const Note = mongoose.model("Note", noteSchema);
