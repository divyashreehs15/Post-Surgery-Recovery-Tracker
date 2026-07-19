import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface FileMetadata {
  originalName: string;
  filePath: string;
  uploadDate: Date;
}

export interface RecoveryAttrs {
  userId: Types.ObjectId;
  patientName: string;
  surgeryType: string;
  recoveryProgress: number; // ✅ strictly numeric now
  symptomScore: number;   
  followUpDate?: Date;
  notes?: string;
  file?: FileMetadata; // optional attachment
  createdAt?: Date;
    mlRecoveryRate?: number;
  mlRiskRate?: number;
  sentiment?: string;
  // ⭐ Add under ML fields ⭐
woundImage?: FileMetadata;
mlWoundAnalysis?: {
  infected: boolean;
  infectionProb: number;
  rednessScore: number;
  recommendation: string;
};


}

export interface RecoveryDoc extends Document, RecoveryAttrs {}

const FileSchema = new Schema<FileMetadata>({
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
});

const RecoverySchema = new Schema<RecoveryDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patientName: { type: String, required: true, trim: true },
    surgeryType: { type: String, required: true, trim: true },
    recoveryProgress: { type: Number, required: true },
    symptomScore: { type: Number, required: true },
    followUpDate: { type: Date },
    notes: { type: String, default: "" },
    file: { type: FileSchema },
    createdAt: { type: Date, default: Date.now },

    // ⭐ ML FIELDS ⭐
    mlRecoveryRate: { type: Number, default: null },
    mlRiskRate: { type: Number, default: null },
    sentiment: { type: String, default: null },
    mlWoundAnalysis: {
  type: {
    infected: Boolean,
    infectionProb: Number,
    rednessScore: Number,
    recommendation: String
  },
  default: null
},
woundImage: { type: FileSchema, default: null }

  },
  { timestamps: false }
);



export const Recovery: Model<RecoveryDoc> =
  mongoose.models.Recovery || mongoose.model<RecoveryDoc>("Recovery", RecoverySchema);
