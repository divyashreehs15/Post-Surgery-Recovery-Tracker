import { Request, Response } from "express";
import { Assignment } from "../models/Assignment";
import { User } from "../models/User";
import mongoose from "mongoose";
import { Recovery } from "../models/Recovery";

// ----------------------------------------------------------
// ASSIGN PATIENTS
// ----------------------------------------------------------
export const assignPatients = async (req: Request, res: Response) => {
  try {
    const { doctorId, patientIds } = req.body;

    if (!doctorId || !Array.isArray(patientIds)) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and patients required",
      });
    }

    let doctorObjectId: any = null;
    if (doctorId !== "admin") {
      doctorObjectId = new mongoose.Types.ObjectId(doctorId);
    }

    const patientObjectIds = patientIds.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );

    if (doctorId !== "admin") {
      const doctor = await User.findById(doctorObjectId);
      if (!doctor || doctor.role !== "doctor") {
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      }
    }

    const assignment = await Assignment.findOneAndUpdate(
      { doctorId: doctorObjectId || null },
      { $addToSet: { patientIds: { $each: patientObjectIds } } },
      { upsert: true, new: true }
    ).populate("patientIds", "name email");

    res.status(200).json({
      success: true,
      message: "Patients assigned successfully",
      assignment,
    });
  } catch (err: any) {
    console.error("🔥 AssignPatients error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------------------------------------------
// UNASSIGN PATIENT
// ----------------------------------------------------------
export const unassignPatient = async (req: Request, res: Response) => {
  try {
    const { doctorId, patientId } = req.body;

    if (!doctorId || !patientId) {
      return res
        .status(400)
        .json({ success: false, message: "doctorId and patientId required" });
    }

    let doctorObjectId: any = null;
    if (doctorId !== "admin") {
      doctorObjectId = new mongoose.Types.ObjectId(doctorId);
    }

    const assignment = await Assignment.findOneAndUpdate(
      { doctorId: doctorObjectId || null },
      { $pull: { patientIds: new mongoose.Types.ObjectId(patientId) } },
      { new: true }
    ).populate("patientIds", "name email");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No assignments found for this doctor",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient unassigned successfully",
      assignment,
    });
  } catch (err: any) {
    console.error("🔥 Unassign error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------------------------------------------
// GET AVAILABLE PATIENTS
// ----------------------------------------------------------
export const getAvailablePatients = async (req: Request, res: Response) => {
  try {
    const allAssignments = await Assignment.find();

    const assignedIds = allAssignments
      .flatMap((a) => a.patientIds || [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const available = await User.find({
      role: "patient",
      _id: { $nin: assignedIds.length ? assignedIds : [] },
    }).select("name email");

    res.status(200).json({ success: true, data: available });
  } catch (err: any) {
    console.error("🔥 getAvailablePatients error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------------------------------------------
// GET DOCTOR ASSIGNMENTS
// ----------------------------------------------------------
export const getDoctorAssignments = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;

    const query =
      doctorId && mongoose.Types.ObjectId.isValid(doctorId)
        ? { doctorId: new mongoose.Types.ObjectId(doctorId) }
        : { doctorId: null };

    const record = await Assignment.findOne(query).populate(
      "patientIds",
      "name email surgeryType surgeryDate createdAt dateOfBirth"
    );

    if (!record) {
      return res.json({ success: true, data: { patientIds: [] } });
    }

    const activityWeights: Record<string, number> = {
      dress: 15,
      bath: 15,
      walk: 20,
      stairs: 25,
      exercise: 25,
    };

    const patientsWithRecovery = await Promise.all(
      record.patientIds.map(async (patient: any) => {
        const recoveries = await Recovery.find({
          $or: [
            { userId: patient._id },
            { patientId: patient._id },
            { userId: patient._id.toString() },
            { patientId: patient._id.toString() },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        let age = "N/A";
        if (patient.dateOfBirth) {
          const dob = new Date(patient.dateOfBirth);
          age = Math.floor(
            (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          ).toString();
        }

        if (!recoveries.length) {
          return {
            ...patient.toObject(),
            painLevel: 0,
            mobility: 0,
            risk: 0,
            status: "stable",
            unreadNotes: 0,
            logEntries: 0,
            age,
            lastUpdated: patient.createdAt,
            recoveryHistory: [],
          };
        }

        const painLevels: number[] = [];
        const mobilityLevels: number[] = [];
        const riskLevels: number[] = [];

        recoveries.forEach((r) => {
          if (typeof r.recoveryProgress === "number")
            painLevels.push(r.recoveryProgress);

          // ⭐ USE ML RISK RATE ⭐
if (typeof r.mlRiskRate === "number") {
  riskLevels.push(r.mlRiskRate);
} else if (typeof r.symptomScore === "number") {
  // fallback if ML not available
  riskLevels.push(r.symptomScore);
}

          const notes = r.notes?.toLowerCase() || "";
          let total = 0;

          for (const [activity, weight] of Object.entries(activityWeights)) {
            if (notes.includes(activity)) total += weight;
          }

          mobilityLevels.push(Math.min(total, 100));
        });

        const avgPain = painLevels.length
          ? painLevels.reduce((a, b) => a + b, 0) / painLevels.length
          : 0;

        const avgRisk = riskLevels.length
  ? riskLevels.reduce((a, b) => a + b, 0) / riskLevels.length
  : 0;


        const avgMobility = mobilityLevels.length
          ? mobilityLevels.reduce((a, b) => a + b, 0) / mobilityLevels.length
          : 0;

        // ------------------ Determine Status (Pain + Risk Avg) ------------------
let status: "stable" | "moderate" | "critical" = "stable";

// Critical → high pain or high risk
if (avgPain > 7 || avgRisk > 70) {
  status = "critical";
}
// Moderate → medium pain or medium risk
else if (avgPain > 3 || avgRisk > 30) {
  status = "moderate";
}
// Stable → low pain and low risk
else {
  status = "stable";
}

const recoveryHistory = recoveries.map((r) => ({
  date: r.createdAt,
  pain: r.recoveryProgress ?? 0,

  mobility: (() => {
    const notes = r.notes?.toLowerCase() || "";
    let total = 0;
    for (const [activity, weight] of Object.entries(activityWeights)) {
      if (notes.includes(activity)) total += weight;
    }
    return Math.min(total, 100);
  })(),

  risk: r.mlRiskRate ?? r.symptomScore ?? 0,
  mlRecoveryRate: r.mlRecoveryRate ?? null,

  // ⭐ SEND ONLY THE FIELDS YOU HAVE
  mlWoundAnalysis: r.mlWoundAnalysis
    ? {
        infected: r.mlWoundAnalysis.infected,
        infectionProb: r.mlWoundAnalysis.infectionProb,
        recommendation: r.mlWoundAnalysis.recommendation,
      }
    : null,

  // ⭐ SEND IMAGE (required)
  woundImage: r.woundImage
    ? {
        originalName: r.woundImage.originalName,
        filePath: r.woundImage.filePath.replace(/\\/g, "/"),
        uploadDate: r.woundImage.uploadDate,
      }
    : null,
}));



        return {
          ...patient.toObject(),
          painLevel: Number(avgPain.toFixed(1)),
          mobility: Number(avgMobility.toFixed(1)),
          risk: Number(avgRisk.toFixed(1)),
          status,
          unreadNotes: recoveries.filter((r) => r.notes?.trim()).length,
          logEntries: recoveries.length,
          age,
          lastUpdated: recoveries[0]?.createdAt ?? patient.createdAt,
          recoveryHistory,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { ...record.toObject(), patientIds: patientsWithRecovery },
    });
  } catch (err: any) {
    console.error("🔥 getDoctorAssignments error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------------------------------------------
// GET MY ASSIGNMENTS
// ----------------------------------------------------------
export const getMyAssignments = async (req: any, res: Response) => {
  try {
    const doctorId = req.user?.userId;

    if (!doctorId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    return getDoctorAssignments({ params: { doctorId } } as any, res);
  } catch (err: any) {
    console.error("🔥 getMyAssignments error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
