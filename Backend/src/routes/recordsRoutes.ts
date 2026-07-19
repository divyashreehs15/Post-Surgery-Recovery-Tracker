import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { listRecords, getRecordById, deleteRecord, upload, createRecord,getReportCount , getRecordsByPatientId,downloadRecord } from "../controllers/recordsController";
import { param, validationResult } from "express-validator";

const router = Router();
router.get("/count", requireAuth, getReportCount);
// 🧾 Upload new record
router.post("/", requireAuth, upload.single("fileUpload"), createRecord);

// 🧾 Get all records for logged-in user
router.get("/", requireAuth, listRecords);

// 🧾 Get records by patientId (doctor view)
router.get("/patient/:patientId", requireAuth, getRecordsByPatientId);

// 🧾 Get specific record by ID
router.get(
  "/:id",
  requireAuth,
  param("id").isMongoId(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: "Invalid id", errors: errors.array() });
    return getRecordById(req, res, next);
  }
);

// 🧾 Delete a record
router.delete(
  "/:id",
  requireAuth,
  param("id").isMongoId(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: "Invalid id", errors: errors.array() });
    return deleteRecord(req, res, next);
  }
);
// ✅ Download route
router.get("/download/:recordId", downloadRecord);

export default router;
