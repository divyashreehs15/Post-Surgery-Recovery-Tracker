import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface AppointmentAttrs {
	userId: Types.ObjectId;
	title: string;
	doctor: string;
	location?: string;
	dateTime: Date;
	type:string;
	notes?: string;
	createdAt?: Date;
}

export interface AppointmentDoc extends Document, AppointmentAttrs {}

const AppointmentSchema = new Schema<AppointmentDoc>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		title: { type: String, required: true, trim: true },
		doctor: { type: String, required: true, trim: true },
		location: { type: String, default: "" },
		dateTime: { type: Date, required: true },
		type: { type: String, default: "follow-up" },
		notes: { type: String, default: "" },
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: false }
);

export const Appointment: Model<AppointmentDoc> =
	mongoose.models.Appointment || mongoose.model<AppointmentDoc>("Appointment", AppointmentSchema);
