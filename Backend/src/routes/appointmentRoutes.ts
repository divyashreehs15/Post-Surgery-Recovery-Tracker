import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { requireAuth } from "../middlewares/auth";
import { createAppointment, deleteAppointment, listAppointments, updateAppointment } from "../controllers/appointmentController";

const router = Router();

router.post(
	"/",
	requireAuth,
	body("title").isString().trim().notEmpty(),
	body("doctor").isString().trim().notEmpty(),
	body("dateTime").isISO8601(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
		return createAppointment(req, res, next);
	}
);

router.get("/", requireAuth, listAppointments);

router.put(
	"/:id",
	requireAuth,
	param("id").isMongoId(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
		return updateAppointment(req, res, next);
	}
);

router.delete(
	"/:id",
	requireAuth,
	param("id").isMongoId(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
		return deleteAppointment(req, res, next);
	}
);

export default router;
