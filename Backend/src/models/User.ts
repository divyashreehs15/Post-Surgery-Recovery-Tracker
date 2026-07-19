import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
interface UserNotificationSettings {
  pushNotifications: boolean;
  emailReminders: boolean;
  smartSnooze: boolean;
}
export interface UserDoc extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "patient";
  createdAt: Date;
  dateOfBirth?: Date; // ✅ fixed (was { type: Date })
  // ✅ Patient-specific fields
  phone?: string;
  address?: string;
  surgeryType?: string;
  surgeryDate?: Date;
  surgeon?: string;
  hospital?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  notificationSettings?: UserNotificationSettings;
  comparePassword(candidate: string): Promise<boolean>;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digitRegex = /^\d{10}$/; // only digits, exactly 10

const UserSchema = new Schema<UserDoc>({
  name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v: string) => emailRegex.test(v),
      message: "Please enter a valid email address.",
    },
  },

  password: { type: String, required: true },

  role: { type: String, enum: ["admin", "doctor", "patient"], default: "patient" },
  createdAt: { type: Date, default: Date.now },

  // ✅ Added DOB here
  dateOfBirth: { type: Date },

  phone: {
    type: String,
    trim: true,
    validate: {
      validator: (v: string) => !v || digitRegex.test(v),
      message: "Phone number must contain exactly 10 digits (0–9 only).",
    },
  },

  address: { type: String, trim: true },
  surgeryType: { type: String, trim: true },
  surgeryDate: { type: Date },
  surgeon: { type: String, trim: true },
  hospital: { type: String, trim: true },
  allergies: { type: String, trim: true },
  medications: { type: String, trim: true },

  emergencyContact: {
    type: String,
    trim: true,
    validate: {
      validator: (v: string) => !v || digitRegex.test(v),
      message: "Emergency contact must contain exactly 10 digits (0–9 only).",
    },
  },
  notificationSettings: {
    type: {
      pushNotifications: { type: Boolean, default: true },
      emailReminders: { type: Boolean, default: false },
      smartSnooze: { type: Boolean, default: true }
    },
    default: () => ({
      pushNotifications: true,
      emailReminders: false,
      smartSnooze: true
    })
  },
});

// ✅ Hash password before saving
UserSchema.pre("save", async function (next) {
  const user = this as UserDoc;
  if (!user.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

// ✅ Compare password
UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User: Model<UserDoc> =
  mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);
