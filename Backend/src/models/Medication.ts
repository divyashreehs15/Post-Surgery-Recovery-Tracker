import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface MedicationAttrs {
	userId: Types.ObjectId;
	name: string;
	dosage: string;
	frequency: string;
	startDate?: Date;
	endDate?: Date;
	notes?: string;
	enabled?: boolean;
	times?: string[];
	lastTaken?: Date | null;
	nextDose?: Date | null;
	createdAt?: Date;
}

export interface MedicationDoc extends Document, MedicationAttrs {}

const MedicationSchema = new Schema<MedicationDoc>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		name: { type: String, required: true, trim: true },
		dosage: { type: String, required: true },
		frequency: { type: String, required: true },
		startDate: { type: Date },
		endDate: { type: Date },
		notes: { type: String, default: "" },
		enabled: { type: Boolean, default: true },
		times: { type: [String], default: [] },
		lastTaken: { type: Date, default: null },
		nextDose: { type: Date, default: null },
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: false }
);

export const Medication: Model<MedicationDoc> =
	mongoose.models.Medication || mongoose.model<MedicationDoc>("Medication", MedicationSchema);
