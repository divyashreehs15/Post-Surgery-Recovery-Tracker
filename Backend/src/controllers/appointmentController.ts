import { Response, NextFunction } from "express";
import { Appointment } from "../models/Appointment";
import { AuthRequest } from "../middlewares/auth";

// =====================================================
//  CREATE APPOINTMENT — converts IST → UTC before saving
// =====================================================
export async function createAppointment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, doctor, location, dateTime,type, notes } = req.body;

    if (!title || !doctor || !dateTime) {
      return res
        .status(400)
        .json({ success: false, message: "title, doctor, and dateTime are required" });
    }

    // Convert IST (frontend local) to UTC before saving
    const istDate = new Date(dateTime);
    const utcDate = new Date(istDate.getTime() - 5.5 * 60 * 60 * 1000); // subtract 5h30m

    const doc = await Appointment.create({
      userId: req.user!.userId,
      title,
      doctor,
      location,
      dateTime: utcDate, // stored as UTC
      type,
      notes,
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return next(err);
  }
}

// =====================================================
//  LIST APPOINTMENTS — sorted by nearest upcoming
// =====================================================
export async function listAppointments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await Appointment.find({ userId: req.user!.userId }).sort({ dateTime: 1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    return next(err);
  }
}

// =====================================================
//  UPDATE APPOINTMENT
// =====================================================
export async function updateAppointment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as any;
    const update = req.body || {};

    // If dateTime is updated, convert it too
    if (update.dateTime) {
      const istDate = new Date(update.dateTime);
      update.dateTime = new Date(istDate.getTime() - 5.5 * 60 * 60 * 1000);
    }

    const doc = await Appointment.findOneAndUpdate(
      { _id: id, userId: req.user!.userId },
      update,
      { new: true }
    );

    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    return next(err);
  }
}

// =====================================================
//  DELETE APPOINTMENT
// =====================================================
export async function deleteAppointment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as any;
    const doc = await Appointment.findOneAndDelete({ _id: id, userId: req.user!.userId });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    return next(err);
  }
}
