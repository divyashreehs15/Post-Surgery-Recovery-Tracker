import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: "normal" | "important" | "urgent";
  isRead: boolean;
  time: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["reminder", "appointment", "medication", "upload", "message", "alert"],
      default: "alert",
    },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },
    isRead: { type: Boolean, default: false },
    time: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>("Notification", NotificationSchema);
