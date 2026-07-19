import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest } from "../middlewares/auth";

// ✅ Admin credentials (should ideally come from .env)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USER || "admin",
  password: process.env.ADMIN_PASS || "admin123",
};

// ✅ Admin login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (
      username === (process.env.ADMIN_USER || "admin") &&
      password === (process.env.ADMIN_PASS || "admin123")
    ) {
      const token = jwt.sign(
        { userId: "admin", role: "admin" }, // ✅ just a string, not ObjectId
        process.env.JWT_SECRET || "mysecretkey",
        { expiresIn: "1h" }
      );

      return res.json({
        success: true,
        message: "Admin logged in successfully",
        token,
      });
    }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Login failed", error });
  }
};

// ✅ Create new doctor/patient
export const createAccount = async (req: AuthRequest, res: Response) => {
  try {
    console.log("👉 CreateAccount called", req.body);

    const { name, email, password, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const newUser = new User({
      name,
      email,
      password: password || "password123",
      role: role || "patient",
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("❌ Create User Error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// ✅ Get all users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: { $in: ["doctor", "patient"] } }).select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users", error });
  }
};

// ✅ Update user info
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user", error });
  }
};

// ✅ Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user", error });
  }
};

// ✅ Get patient details
export const getPatientDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get Patient Details Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch details", error });
  }
};

// ✅ Update patient details (for editing)
// ✅ Update patient details (only for patients)
export const updatePatientDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "Cannot update details for a non-patient user",
      });
    }

    Object.assign(user, updates);
    await user.save();

    res.json({
      success: true,
      message: "Patient details updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("❌ Update Patient Details Error:", error);
    res.status(500).json({ success: false, message: "Failed to update details", error });
  }
};


// ✅ Add patient details (AFTER user creation)
// ✅ Add patient details (only for patients)
export const addPatientDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      address,
      phone,
      allergies,
      medications,
      surgeryDate,
      surgeryType,
      surgeon,
      hospital,
      emergencyContact,
    } = req.body;

    // ✅ Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Only patients can have details added
    if (user.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "Cannot add patient details for a non-patient user",
      });
    }

    // ✅ Add details (ensure your schema supports these fields)
    user.address = address;
    user.phone = phone;
    user.allergies = allergies;
    user.medications = medications;
    user.surgeryDate = surgeryDate;
    user.surgeryType = surgeryType;
    user.surgeon = surgeon;
    user.hospital = hospital;
    user.emergencyContact = emergencyContact;

    await user.save();

    res.json({
      success: true,
      message: "Patient details saved successfully",
      data: user,
    });
  } catch (error) {
    console.error("❌ Add Patient Details Error:", error);
    res.status(500).json({ success: false, message: "Failed to add details", error });
  }
};
