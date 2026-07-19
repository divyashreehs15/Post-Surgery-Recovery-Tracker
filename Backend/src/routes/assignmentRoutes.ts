import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  assignPatients,
  unassignPatient,
  getAvailablePatients,
  getDoctorAssignments,
  getMyAssignments,
} from "../controllers/assignmentController";

const router = Router();
router.get("/my", requireAuth, getMyAssignments);

// ✅ Assign multiple patients to a doctor
router.post("/", requireAuth, requireAdmin, assignPatients);

// ✅ Unassign one patient
router.put("/unassign", requireAuth, requireAdmin, unassignPatient);

// ✅ Get all available (unassigned) patients
router.get("/available", requireAuth, requireAdmin, getAvailablePatients);

// ✅ Get all assigned patients for a specific doctor
router.get("/:doctorId", requireAuth, requireAdmin, getDoctorAssignments);

export default router;
