// backend/routes/authRoutes.ts
import { Router } from "express";
import { login, register } from "../controllers/authController";

const router = Router();

// ✅ Register new user
router.post("/register", register);

// ✅ Login user
router.post("/login", login);

export default router;
