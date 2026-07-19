import mongoose, { Schema, Document, Model } from "mongoose";

export interface AssignmentDoc extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientIds: mongoose.Types.ObjectId[];
  assignedAt: Date;
}

const AssignmentSchema = new Schema<AssignmentDoc>({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // ✅ one document per doctor
  },
  patientIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Assignment: Model<AssignmentDoc> =
  mongoose.models.Assignment ||
  mongoose.model<AssignmentDoc>("Assignment", AssignmentSchema);
