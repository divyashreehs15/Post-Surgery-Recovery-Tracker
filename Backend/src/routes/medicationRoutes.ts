import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { requireAuth } from "../middlewares/auth";
import { createMedication, deleteMedication, listMedications, updateMedication, markMedicationTaken } from "../controllers/medicationController";

const router = Router();

router.post(
	"/",
	requireAuth,
	body("name").isString().trim().notEmpty(),
	body("dosage").isString().trim().notEmpty(),
	body("frequency").isString().trim().notEmpty(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
		return createMedication(req, res, next);
	}
);

router.get("/", requireAuth, listMedications);

router.put(
	"/:id",
	requireAuth,
	param("id").isMongoId(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
		return updateMedication(req, res, next);
	}
);

router.patch(
	"/:id/mark-taken",
	requireAuth,
	param("id").isMongoId(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
		return markMedicationTaken(req, res, next);
	}
);

router.delete(
	"/:id",
	requireAuth,
	param("id").isMongoId(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
		return deleteMedication(req, res, next);
	}
);

export default router;
