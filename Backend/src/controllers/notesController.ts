// controllers/notesController.ts
import { Request, Response } from "express";
import { Note } from "../models/Notes";
import { AuthRequest } from "../middlewares/auth";

export const addNote = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, content, pinned, priority } = req.body;
    const doctorId = req.user?.userId;

    const note = await Note.create({
      doctorId,
      patientId,
      content,
      pinned,
      priority,
    });

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    console.error("❌ Error adding note:", err);
    res.status(500).json({ success: false, message: "Failed to add note" });
  }
};

export const getNotesByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const notes = await Note.find({ patientId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: notes });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ✅ toggle pinning
export const toggleNotePin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });

    note.pinned = !note.pinned;
    await note.save();

    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle pin" });
  }
};
