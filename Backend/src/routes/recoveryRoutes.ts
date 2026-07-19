import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { upload } from "../middlewares/upload";
import { createRecovery, deleteRecovery, getRecoveryById, listRecoveries,getLatestRecovery,getWoundAnalysisByPatient } from "../controllers/recoveryController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// ✅ Get latest recovery entry for the logged-in user
router.get("/latest", requireAuth, getLatestRecovery);
router.post(
	"/",
	requireAuth,
	upload.single("file"),
	body("patientName").isString().trim().notEmpty(),
body("surgeryType").isString().trim().notEmpty(),
body("recoveryProgress").exists(),
body("symptomScore").exists().isNumeric(),
body("notes").optional().isString(),        // ⭐ ADD THIS
body("woundStatus").custom(() => true), // ⭐ ADD THIS

	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: false, message: "Invalid input", errors: errors.array() });
		}
		return createRecovery(req, res, next);
	}
);

router.get("/", requireAuth, listRecoveries);
router.get("/wound-analysis/:patientId", requireAuth, getWoundAnalysisByPatient);
router.get(
	"/:id",
	requireAuth,
	param("id").isMongoId(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: false, message: "Invalid id", errors: errors.array() });
		}
		return getRecoveryById(req, res, next);
	}
);

router.delete(
	"/:id",
	requireAuth,
	param("id").isMongoId(),
	(req: any, res: any, next: any) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: false, message: "Invalid id", errors: errors.array() });
		}
		return deleteRecovery(req, res, next);
	}
	
);



export default router;
