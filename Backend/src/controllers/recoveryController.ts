import { Request, Response, NextFunction } from "express";
import { Recovery } from "../models/Recovery";
import { Assignment } from "../models/Assignment";
import { Note } from "../models/Notes";

import fs from "fs/promises";
import path from "path";
import { AuthRequest } from "../middlewares/auth";
import axios from "axios";
import mongoose from "mongoose";


/** -------------------------
 *  ML RESPONSE TYPE
 * --------------------------
 */
interface MLResponse {
  recoveryRate: number;
  riskRate: number;
  sentiment: string;
}

/** -------------------------
 *  CREATE RECOVERY ENTRY
 * --------------------------
 */
/** -------------------------
 *  CREATE RECOVERY ENTRY  (UPDATED WITH IMAGE ML)
 * -------------------------- */
export async function createRecovery(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { 
      patientName, 
      surgeryType, 
      recoveryProgress, 
      symptomScore,
      followUpDate, 
      notes 
    } = req.body;

    if (!patientName || !surgeryType) {
      return res.status(400).json({
        success: false,
        message: "patientName and surgeryType are required",
      });
    }

    /** -------------------------
     *  FILE HANDLING (WOUND IMAGE)
     * -------------------------- */
    const woundImageFile = (req as any).file as Express.Multer.File | undefined;

    const woundImage = woundImageFile
      ? {
          originalName: woundImageFile.originalname,
          filePath: path.normalize(woundImageFile.path),
          uploadDate: new Date(),
        }
      : undefined;

    /** -------------------------
     *  VALIDATION
     * -------------------------- */
    const numericProgress = Number(recoveryProgress);
    const numericSymptomScore = Number(symptomScore);

    if (isNaN(numericProgress) || isNaN(numericSymptomScore)) {
      return res.status(400).json({
        success: false,
        message: "recoveryProgress and symptomScore must be numeric"
      });
    }

    /** -------------------------
     *  ⭐ CALL TEXT ML SERVICE ⭐
     * -------------------------- */
    let mlRecoveryRate = null;
    let mlRiskRate = null;
    let sentiment = null;

    try {
      const mlResponse = await axios.post<MLResponse>(
        "http://127.0.0.1:8000/predict",
        {
          pain: numericProgress,
          symptom_score: numericSymptomScore,
          wound_status: req.body.woundStatus || "healing-well",
          notes: notes || ""
        }
      );

      mlRecoveryRate = mlResponse.data.recoveryRate;
      mlRiskRate = mlResponse.data.riskRate;
      sentiment = mlResponse.data.sentiment;

    } catch (err: any) {
      console.error("❌ ML Service Error:", err.message);
    }

    /** -------------------------
     *  ⭐ CALL ML IMAGE ANALYSIS ⭐
     * -------------------------- */
    let mlWoundAnalysis: any = null;

    if (woundImageFile) {
      try {
        const FormData = require("form-data");
        const fs = require("fs");

        const form = new FormData();
        form.append(
          "image",
          fs.createReadStream(woundImageFile.path),
          woundImageFile.originalname
        );

        const mlImgResp = await axios.post(
          "http://127.0.0.1:8000/analyze-image",
          form,
          { headers: form.getHeaders() }
        );

        mlWoundAnalysis = mlImgResp.data;
        /** -------------------------
 *  AUTO-NOTIFY DOCTOR (CRITICAL WOUND)
 * -------------------------- */
if (mlWoundAnalysis && mlWoundAnalysis.severity !== "low") {

  // Fetch doctor assigned to this patient
  const assignDoc = await Assignment.findOne({ patientId: req.user!.userId });

  if (assignDoc?.doctorId) {
    // Create an urgent doctor note
    await Note.create({
      patientId: req.user!.userId,
      doctorId: assignDoc.doctorId,
      content: `⚠️ *Urgent Wound Alert*  
The patient's wound image shows **${mlWoundAnalysis.severity.toUpperCase()} infection risk**  
Probability: ${mlWoundAnalysis.infectionProb * 100}%  
Recommendation: ${mlWoundAnalysis.recommendation}`,
      pinned: true,
      priority: "high",
    });
  }
}


      } catch (err: any) {
        console.error("❌ Image ML Failed:", err.message);
      }
    }

    /** -------------------------
     *  SAVE ENTRY TO DATABASE
     * -------------------------- */
    const created = await Recovery.create({
      userId: req.user!.userId,
      patientName,
      surgeryType,
      recoveryProgress: numericProgress,
      symptomScore: numericSymptomScore,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      notes,
      file: undefined,            // keep old file logic separate
      woundImage,                // ⭐ store wound image
      mlRecoveryRate,
      mlRiskRate,
      sentiment,
      mlWoundAnalysis            // ⭐ store ML image results
    });

    return res.status(201).json({ success: true, data: created });

  } catch (err) {
    return next(err);
  }
}


/** -------------------------
 *  LIST RECOVERIES
 * -------------------------- */
export async function listRecoveries(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const records = await Recovery.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: records });
  } catch (err) {
    return next(err);
  }
}

/** -------------------------
 *  GET SINGLE RECOVERY
 * -------------------------- */
export async function getRecoveryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as any;
    const rec = await Recovery.findOne({ _id: id, userId: req.user!.userId });
    if (!rec) return res.status(404).json({ success: false, message: "Record not found" });
    return res.json({ success: true, data: rec });
  } catch (err) {
    return next(err);
  }
}

/** -------------------------
 *  DELETE RECOVERY
 * -------------------------- */
export async function deleteRecovery(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as any;
    const rec = await Recovery.findOneAndDelete({ _id: id, userId: req.user!.userId });
    if (!rec) return res.status(404).json({ success: false, message: "Record not found" });

    if (rec.file?.filePath) {
      try {
        await fs.unlink(rec.file.filePath);
      } catch (e: any) {
        if (e?.code !== "ENOENT") throw e;
      }
    }

    return res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    return next(err);
  }
}

/** -------------------------
 *  LATEST RECOVERY
 * -------------------------- */
export async function getLatestRecovery(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const latest = await Recovery.findOne({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .select("createdAt notes recoveryProgress symptomScore mlRecoveryRate mlRiskRate sentiment");

    if (!latest) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: latest });
  } catch (err) {
    return next(err);
  }
}

export const getWoundAnalysisByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const recoveries = await Recovery.find({
      $or: [{ userId: patientId }, { patientId }],
      woundImage: { $ne: null },
      mlWoundAnalysis: { $ne: null },
    })
      .sort({ "woundImage.uploadDate": -1 })
      .lean();

    const formatted = recoveries.map((r: any) => ({
      _id: r._id,
      createdAt: r.createdAt,
      woundImage: {
        filePath: r.woundImage.filePath.replace(/\\/g, "/"),
        uploadDate: r.woundImage.uploadDate,
      },
      mlWoundAnalysis: {
        infected: r.mlWoundAnalysis.infected,
        infectionProb: r.mlWoundAnalysis.infectionProb,
        recommendation: r.mlWoundAnalysis.recommendation,
      },
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error("❌ wound analysis error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

