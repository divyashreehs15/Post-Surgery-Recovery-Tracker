import { Response, NextFunction } from "express";
import { Medication } from "../models/Medication";
import { AuthRequest } from "../middlewares/auth";

function computeNextDoseFromTimes(times: string[], from: Date): Date | null {
	if (!times || times.length === 0) return null;
	const now = from;
	const today = new Date(now);
	for (const t of times) {
		const [h, m] = t.split(":").map((x) => parseInt(x, 10));
		if (isNaN(h) || isNaN(m)) continue;
		const candidate = new Date(today);
		candidate.setHours(h, m, 0, 0);
		if (candidate > now) return candidate;
	}
	// next day's first time
	const [h, m] = times[0].split(":").map((x) => parseInt(x, 10));
	if (isNaN(h) || isNaN(m)) return null;
	const nextDay = new Date(today);
	nextDay.setDate(today.getDate() + 1);
	nextDay.setHours(h, m, 0, 0);
	return nextDay;
}

export async function createMedication(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { patientId, name, dosage, frequency, startDate, endDate, notes, times, enabled } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: "patientId is required" });
    }

    if (!name || !dosage || !frequency) {
      return res.status(400).json({ success: false, message: "name, dosage, frequency are required" });
    }

    const now = new Date();
    const nextDose = computeNextDoseFromTimes(times || [], now);

    const doc = await Medication.create({
      userId: patientId,   // 👈 store for the patient, not doctor
      name,
      dosage,
      frequency,
      startDate,
      endDate,
      notes,
      times: Array.isArray(times) ? times : [],
      enabled: enabled !== undefined ? !!enabled : true,
      nextDose,
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return next(err);
  }
}


export async function listMedications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const patientId = req.query.patientId; // doctor calling API with ?patientId=XYZ

    let filter: any = {};

    if (patientId) {
      // doctor viewing a patient's medications
      filter.userId = patientId;
    } else {
      // patient viewing own medications
      filter.userId = req.user!.userId;
    }

    const items = await Medication.find(filter).sort({ createdAt: -1 });

    return res.json({ success: true, data: items });
  } catch (err) {
    return next(err);
  }
}


export async function updateMedication(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const { id } = req.params as any;
		const update: any = req.body || {};
		if (update.times) {
			update.nextDose = computeNextDoseFromTimes(update.times, new Date());
		}
		const doc = await Medication.findOneAndUpdate({ _id: id, userId: req.user!.userId }, update, { new: true });
		if (!doc) return res.status(404).json({ success: false, message: "Not found" });
		return res.json({ success: true, data: doc });
	} catch (err) { return next(err); }
}

export async function deleteMedication(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const { id } = req.params as any;
		const doc = await Medication.findOneAndDelete({ _id: id, userId: req.user!.userId });
		if (!doc) return res.status(404).json({ success: false, message: "Not found" });
		return res.json({ success: true, message: "Deleted" });
	} catch (err) { return next(err); }
}

export async function markMedicationTaken(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const { id } = req.params as any;
		const med = await Medication.findOne({ _id: id, userId: req.user!.userId });
		if (!med) return res.status(404).json({ success: false, message: "Not found" });
		const now = new Date();
		med.lastTaken = now;
		med.nextDose = computeNextDoseFromTimes(med.times || [], now);
		await med.save();
		return res.json({ success: true, data: med });
	} catch (err) { return next(err); }
}
