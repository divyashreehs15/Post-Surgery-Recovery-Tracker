import { Request, Response } from "express";
import Notification from "../models/Notification";

// 📩 Get all notifications for a specific user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Mark a specific notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (err) {
    console.error("Error marking as read:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔔 Create new notification (for testing)
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type, priority } = req.body;
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      priority,
    });
    res.status(201).json(notification);
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ message: "Server error" });
  }
};
