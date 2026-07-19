import express from "express";
import {
  getNotifications,
  markAsRead,
  createNotification,
} from "../controllers/notificationController";

const router = express.Router();

router.get("/:userId", getNotifications);
router.patch("/:id/read", markAsRead);
router.post("/", createNotification);

export default router;
