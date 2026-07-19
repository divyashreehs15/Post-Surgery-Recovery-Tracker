import express from "express";
import { requireAuth } from "../middlewares/auth";
import { addNote, getNotesByPatient, toggleNotePin } from "../controllers/notesController";

const router = express.Router();

router.post("/", requireAuth, addNote);
router.get("/:patientId", requireAuth, getNotesByPatient);
router.patch("/:id/pin", requireAuth, toggleNotePin);


export default router;
