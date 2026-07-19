import { Request, Response } from "express";
import { User } from "../models/User";
import { Recovery } from "../models/Recovery"; // ✅ Updated import

// ✅ Extend Express Request inline
declare module "express-serve-static-core" {
 interface Request {
    user?: { id?: string; userId?: string; role?: string }; // <-- Definition from another file
}
}

// ✅ Fetch own profile (logged-in patient)
export const getPatientProfile = async (req: Request, res: Response) => {
  console.log("📩 [GET] /api/patient/me — Fetching patient profile");
  try {
    console.log("➡️ User ID from token:", req.user?.userId);
    const user = await User.findById(req.user?.userId).select("-password");

    if (!user) {
      console.warn("⚠️ User not found:", req.user?.userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("✅ Profile fetched successfully");
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("❌ Error getting patient profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update own profile (patient)
export const updatePatientProfile = async (req: Request, res: Response) => {
  console.log("📩 [PUT] /api/patient/me — Updating profile");
  try {
    const allowedFields = [
      "phone",
      "address",
      "surgeryType",
      "surgeryDate",
      "surgeon",
      "hospital",
      "allergies",
      "medications",
      "emergencyContact",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    console.log("🛠 Update data:", updateData);

    const updated = await User.findByIdAndUpdate(req.user?.userId, updateData, {
      new: true,
    }).select("-password");

    if (!updated) {
      console.warn("⚠️ Update failed — user not found:", req.user?.userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("✅ Profile updated successfully for:", updated._id);
    res.json({ success: true, message: "Profile updated", data: updated });
  } catch (err) {
    console.error("❌ Error updating patient profile:", err);
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
};

// ✅ Fetch patient stats dynamically using Recovery model
export const getPatientStats = async (req: Request, res: Response) => {
  console.log("📊 [GET] /api/patient/stats — Computing patient stats");
  try {
    const userId = req.user?.userId;
    if (!userId) {
      console.warn("⚠️ Unauthorized access — no userId found in token");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch all recovery logs for this patient
    const logs = await Recovery.find({ userId }).sort({ createdAt: 1 });
    console.log(`🗂 Found ${logs.length} recovery entries for user:`, userId);

    if (!logs.length) {
      console.log("ℹ️ No recovery entries found for user, returning zero stats");
      return res.json({
        success: true,
        data: { totalLogs: 0, totalReports: 0, daysTracked: 0, averagePain: 0 },
      });
    }

    // Compute stats
    const totalLogs = logs.length;
    const totalReports = logs.filter((l) => l.file && l.file.filePath).length;
    const uniqueDays = new Set(logs.map((l) => new Date(l.createdAt!).toDateString()));
    const daysTracked = uniqueDays.size;

    const progressValues = logs
      .map((l) => Number(l.recoveryProgress))
      .filter((v) => !isNaN(v));
    const averagePain =
      progressValues.length > 0
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

    console.log("📈 Stats calculated:", {
      totalLogs,
      totalReports,
      daysTracked,
      averagePain,
    });

    res.json({
      success: true,
      data: { totalLogs, totalReports, daysTracked, averagePain },
    });
  } catch (err) {
    console.error("❌ Error computing patient stats:", err);
    res.status(500).json({ success: false, message: "Server error computing stats" });
  }
};
