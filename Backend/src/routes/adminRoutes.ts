import express from "express";
import {
  adminLogin,
  createAccount,
  getAllUsers,
  updateUser,
  deleteUser,
  addPatientDetails,
  getPatientDetails,
  updatePatientDetails,
} from "../controllers/adminController";

import { requireAuth } from "../middlewares/auth";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/create", requireAuth, createAccount);
router.get("/users", requireAuth, getAllUsers);
router.put("/users/:id", requireAuth, updateUser);
router.delete("/users/:id", requireAuth, deleteUser);
router.post("/users/:id/details", requireAuth, addPatientDetails);
router.get("/users/:id/details", requireAuth, getPatientDetails);
router.put("/users/:id/details", requireAuth, updatePatientDetails);


export default router;
