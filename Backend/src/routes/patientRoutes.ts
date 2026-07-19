import express from "express";
import { requireAuth } from "../middlewares/auth";
import {
  getPatientProfile,
  updatePatientProfile,
  getPatientStats,
} from "../controllers/patientController";

const router = express.Router();

router.get("/me", requireAuth, getPatientProfile);
router.put("/me", requireAuth, updatePatientProfile);

// Add these 👇
router.get("/stats", requireAuth, getPatientStats);


export default router;
