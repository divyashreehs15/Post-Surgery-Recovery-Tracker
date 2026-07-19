import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { Assignment } from "../models/Assignment";
import { Medication } from "../models/Medication";
import Notification from "../models/Notification"; // ✅ default export
import { Record } from "../models/Record";
import { Recovery } from "../models/Recovery";
import fs from "fs";


// ✅ GET: List all users (excluding passwords)
export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

// ✅ GET: Fetch a single user by ID
export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ✅ POST: Create a new user (includes dateOfBirth)
export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      surgeryType,
      surgeryDate,
      surgeon,
      hospital,
      allergies,
      medications,
      emergencyContact,
      dateOfBirth, // ✅ Added this line
    } = req.body;

    // Check for existing email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    // Prevent clients from creating admin accounts directly
    const safeRole = role === "admin" ? "patient" : role;

    // ✅ Optional: Validate dateOfBirth format if provided
    if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format for dateOfBirth" });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      phone,
      address,
      surgeryType,
      surgeryDate,
      surgeon,
      hospital,
      allergies,
      medications,
      emergencyContact,
      dateOfBirth, // ✅ Save DOB
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ✅ PUT/PATCH: Update user details safely (includes DOB)
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { password, ...updates } = req.body; // prevent overwriting password directly

    // ✅ Validate DOB if present
    if (updates.dateOfBirth && isNaN(Date.parse(updates.dateOfBirth))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format for dateOfBirth" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true, // ✅ ensure Mongoose validation still applies
    }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ✅ DELETE: Remove user by ID
// ✅ DELETE: Remove user by ID
// ✅ DELETE: Remove user by ID
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userIdStr = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const userIdObj = new mongoose.Types.ObjectId(userIdStr);

    // Check if user exists first
    const user = await User.findById(userIdStr);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`🧹 Deleting all data for user: ${userIdStr} (${user.name})`);

    // 🩺 Delete all dependent data
    const deletedAppointments = await Appointment.deleteMany({
      $or: [{ userId: userIdStr }, { userId: userIdObj }],
    });

    const deletedAssignments = await Assignment.deleteMany({
      $or: [{ patientIds: userIdStr }, { patientIds: userIdObj }],
    });

    const deletedMedications = await Medication.deleteMany({
      $or: [{ userId: userIdStr }, { userId: userIdObj }],
    });

    const deletedNotifications = await Notification.deleteMany({
      $or: [{ userId: userIdStr }, { userId: userIdObj }],
    });

    const deletedRecords = await Record.deleteMany({
      $or: [{ userId: userIdStr }, { userId: userIdObj }],
    });

    const deletedRecoveries = await Recovery.deleteMany({
      $or: [{ userId: userIdStr }, { userId: userIdObj }],
    });

    // 🧍 Finally delete the user itself
    await User.findByIdAndDelete(userIdStr);

    console.log(`✅ User ${userIdStr} and all related data deleted successfully`);

    return res.status(200).json({
      success: true,
      message: "User and all related data deleted successfully.",
      deletedCounts: {
        appointments: deletedAppointments.deletedCount,
        assignments: deletedAssignments.deletedCount,
        medications: deletedMedications.deletedCount,
        notifications: deletedNotifications.deletedCount,
        records: deletedRecords.deletedCount,
        recoveries: deletedRecoveries.deletedCount,
      },
    });
  } catch (err) {
    console.error("❌ Error deleting user and related data:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting user and related data",
    });
  }
};
// ✅ ADD THESE TWO FUNCTIONS AT THE END:

// GET user notification settings
export async function getUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id).select('notificationSettings');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        notificationSettings: user.notificationSettings || {
          pushNotifications: true,
          emailReminders: false,
          smartSnooze: true
        }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    next(error);
  }
}

// UPDATE user notification settings
export async function updateUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { notificationSettings } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { notificationSettings } },
      { new: true, runValidators: true }
    ).select('notificationSettings');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.status(200).json({
      success: true,
      data: { notificationSettings: user.notificationSettings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    next(error);
  }
}