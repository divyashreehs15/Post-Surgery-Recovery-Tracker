import { Router, Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import { requireAuth } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
  getUserSettings,      // ✅ ADD THIS
  updateUserSettings,
} from "../controllers/userController";
import { User } from "../models/User";
import { AuthRequest } from "../middlewares/auth";

const router = Router();

/* -------------------------------------------------------------------------- */
/* 🧩 Helper Function — unified validation error handler                       */
/* -------------------------------------------------------------------------- */
function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

/* -------------------------------------------------------------------------- */
/* 👑 Admin Routes — protected and validated                                   */
/* -------------------------------------------------------------------------- */

// ✅ GET all users (Admin only)
router.get("/", requireAuth, requireAdmin, listUsers);

// ✅ Create a new user (Admin only)
router.post(
  "/",
  requireAuth,
  requireAdmin,
  body("name").isString().trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email format."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("role").isIn(["admin", "doctor", "patient"]).withMessage("Invalid role."),
  // Optional patient fields validation
  body("phone")
    .optional()
    .isString()
    .matches(/^\d{10}$/)
    .withMessage("Phone number must be exactly 10 digits."),
  body("emergencyContact")
    .optional()
    .isString()
    .matches(/^\d{10}$/)
    .withMessage("Emergency contact must be exactly 10 digits."),
  validate,
  createUser
);

// ✅ Delete user (Admin only)
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  param("id").isMongoId().withMessage("Invalid user ID."),
  validate,
  deleteUser
);

/* -------------------------------------------------------------------------- */
/* 👤 Authenticated User Routes                                                */
/* -------------------------------------------------------------------------- */

// ✅ Get single user by ID (any authenticated user)
router.get("/:id", requireAuth, param("id").isMongoId(), validate, getUser);

// ✅ Update user (admin or self)
router.put(
  "/:id",
  requireAuth,
  param("id").isMongoId().withMessage("Invalid user ID."),
  validate,
  updateUser
);

// ✅ Update own profile (self)
router.put("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authorized" });
    }

    const allowedFields = [
      "name",
      "phone",
      "address",
      "surgeryType",
      "surgeryDate",
      "surgeon",
      "hospital",
      "allergies",
      "medications",
      "emergencyContact",
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // ✅ Validation for digits in phone and emergencyContact
    if (updates.phone && !/^\d{10}$/.test(updates.phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Phone must be 10 digits." });
    }
    if (
      updates.emergencyContact &&
      !/^\d{10}$/.test(updates.emergencyContact)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Emergency contact must be 10 digits." });
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Profile updated", user });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get(
  "/:id/settings", 
  requireAuth, 
  param("id").isMongoId().withMessage("Invalid user ID."),
  validate,
  getUserSettings
);

// UPDATE user notification settings
router.patch(
  "/:id/settings", 
  requireAuth,
  param("id").isMongoId().withMessage("Invalid user ID."),
  validate,
  updateUserSettings
);

export default router;
