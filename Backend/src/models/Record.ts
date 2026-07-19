import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface FileMetadata {
  originalName: string;
  filePath: string;
  uploadDate: Date;
}

export interface RecordAttrs {
  userId: Types.ObjectId;
  patientName: string;
  surgeryType: string;
  notes?: string;
  file: FileMetadata;
  createdAt?: Date;
}

export interface RecordDoc extends Document, RecordAttrs {}

const FileSchema = new Schema<FileMetadata>({
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
});

const RecordSchema = new Schema<RecordDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true },
    surgeryType: { type: String, required: true },
    notes: { type: String },
    file: { type: FileSchema, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Record: Model<RecordDoc> =
  mongoose.models.Record || mongoose.model<RecordDoc>("Record", RecordSchema);
