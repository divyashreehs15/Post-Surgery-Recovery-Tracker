import { Request, Response, NextFunction } from "express";
import { Record } from "../models/Record";
import { Recovery } from "../models/Recovery";
import { Assignment } from "../models/Assignment";
import { AuthRequest } from "../middlewares/auth";
import { Note } from "../models/Notes";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import * as fsSync from "fs"; 

// 🗂️ Multer setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
export const upload = multer({ storage });

// 🧾 Create record (upload file)
// ML response type
interface MLAnalysisResponse {
  infected: boolean;
  infectionProb: number;
  severity: string;
  recommendation: string;
  scores: any;
}

export async function createRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    const { patientName, surgeryType, notes } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // 1️⃣ Save normal record
    const record = await Record.create({
      userId: req.user!.userId,
      patientName,
      surgeryType,
      notes,
      file: {
        originalName: file.originalname,
        filePath: `uploads/${file.filename}`,
        uploadDate: new Date(),
      },
    });

    // 2️⃣ ML wound analysis
    try {
      const FormData = require("form-data");
      const fs = require("fs");

      const form = new FormData();
      form.append(
        "image",
        fs.createReadStream(`uploads/${file.filename}`),
        file.originalname
      );

      // ⭐ add MLAnalysisResponse type here
      const mlResp = await axios.post<MLAnalysisResponse>(
        "http://127.0.0.1:8000/analyze-image",
        form,
        { headers: form.getHeaders() }
      );

      const mlResult = mlResp.data; // ✔ No more unknown type

      // 4️⃣ Auto notify doctor
      if (mlResult.severity !== "low") {
        const assign = await Assignment.findOne({ patientId: req.user!.userId });

        if (assign?.doctorId) {
          await Note.create({
            patientId: req.user!.userId,
            doctorId: assign.doctorId,
            pinned: true,
            priority: "high",
            content: `⚠️ *Urgent Wound Alert*
Severity: ${mlResult.severity.toUpperCase()}
Infection Risk: ${(mlResult.infectionProb * 100).toFixed(1)}%
Recommendation: ${mlResult.recommendation}`,
          });
        }
      }

    } catch (err) {
      console.error("❌ ML analysis failed:", (err as Error).message);
    }

    return res.json({ success: true, data: record });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  }
}


// 🧾 Get all records for logged-in user (patient)
export async function listRecords(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const records = await Record.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: records });
  } catch (err) {
    return next(err);
  }
}

// 🧾 Get records for specific patient (for doctor view)
export const getRecordsByPatientId = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    console.log("📥 Fetching records for patient:", patientId);
    const records = await Record.find({ userId: patientId });
    console.log("📤 Found records:", records.length);
    res.json({ success: true, data: records });
  } catch (error) {
    console.error("❌ getRecordsByPatientId failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🧾 Get single record by ID
export async function getRecordById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const record = await Record.findOne({ _id: id, userId: req.user!.userId });
    if (!record)
      return res.status(404).json({ success: false, message: "Report not found" });
    return res.json({ success: true, data: record });
  } catch (err) {
    return next(err);
  }
}

// 🧾 Delete record
export async function deleteRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const record = await Record.findOneAndDelete({ _id: id, userId: req.user!.userId });
    if (!record)
      return res.status(404).json({ success: false, message: "Report not found" });

    if (record.file?.filePath) {
      try {
        await fs.unlink(record.file.filePath);
      } catch (e: any) {
        if (e?.code !== "ENOENT") throw e;
      }
    }

    return res.json({ success: true, message: "Report deleted" });
  } catch (err) {
    return next(err);
  }
}
export const downloadRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Record.findById(req.params.recordId);
    if (!record || !record.file?.filePath) {
      res.status(404).json({ success: false, message: "File not found" });
      return;
    }

    const filePath = path.resolve(record.file.filePath);

    // ✅ Use fsSync.existsSync because fs (promises) doesn’t have existsSync
    if (!fsSync.existsSync(filePath)) {
      res.status(404).json({ success: false, message: "File missing on server" });
      return;
    }

    const fileName = record.file.originalName || "report.pdf";

    // ✅ Provide callback to satisfy TypeScript and handle errors
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("❌ Error while sending file:", err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "Failed to download file" });
        }
      }
    });
  } catch (err) {
    console.error("❌ Download error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};
// 🧮 Get report count for logged-in user
export async function getReportCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await Record.countDocuments({ userId: req.user!.userId });
    return res.json({ success: true, data: { totalReports: count } });
  } catch (err) {
    console.error("❌ Error fetching report count:", err);
    return next(err);
  }
}

