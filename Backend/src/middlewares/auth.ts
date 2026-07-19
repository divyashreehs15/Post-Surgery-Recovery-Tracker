import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ✅ Extend Express Request type inline
declare module "express-serve-static-core" {
  interface Request {
    user?: { id?: string;userId?: string; role?: string };
  }
}

// ✅ Helper to get JWT secret safely
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export interface AuthRequest extends Request {
  user?: {  userId?: string; role?: string };
}

// ✅ Core authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : undefined;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Missing Authorization header" });
  }

  try {
    // Verify and decode JWT
    const payload = jwt.verify(token, getJwtSecret()) as {
      id?: string;
      userId?: string;
      role?: string;
    };

    req.user = {
      id: payload.id || payload.userId,
      userId: payload.id || payload.userId,
      role: payload.role,
    };

    // ✅ Allow admin even if no MongoDB ID
    if (req.user?.userId === "admin" && req.user?.role === "admin") {
      return next();
    }

    // ✅ Normal users must have valid ObjectId
    if (!req.user?.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });
    }

    next();
  } catch (err: any) {
    if (err.message === "JWT_SECRET is not configured") {
      return res.status(500).json({ success: false, message: err.message });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

// ✅ Alias for readability
export const protect = requireAuth;

// ✅ Admin-only route guard (no DB check)
export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.userId === "admin" && req.user?.role === "admin") {
    return next();
  }

  return res
    .status(403)
    .json({ success: false, message: "Admin access only" });
}
