import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// NOTE: I am assuming you have a proper User model setup here.
import { User, UserDoc } from "../models/User"; 

// Interface for the incoming login request body
interface LoginRequestBody {
    email: string;
    password: string;
    role: "patient" | "doctor" | "admin"; 
}

/**
 * Safely get the JWT secret from environment variables
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

/**
 * Generate a JWT for the given user ID and role
 */
function signToken(userId: string, role: string): string {
  // Including the role in the payload is best practice
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: "7d" });
}

/**
 * 🚨 FIX: Register a new user (Ensure this function is EXPORTED)
 * NOTE: The registered user will be assigned the default role (likely 'patient'
 * based on your typical schema setup)
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // Assuming you expect 'name' on registration
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required for registration",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    // Role will default to 'patient' as per your schema (adjust if necessary)
    // NOTE: The User model logic determines the default role here.
    const user: UserDoc = await User.create({ name, email, password, role: 'patient' }); 
    
    // Use the user's determined role when signing the token
    const token = signToken(user.id, user.role); 

    return res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    // Pass the error to the Express error handler
    return next(err);
  }
}

// ----------------------------------------------------------------------
// ✅ Login function (Ensure this function is EXPORTED)
// ----------------------------------------------------------------------
export async function login(req: Request<{}, {}, LoginRequestBody>, res: Response, next: NextFunction) {
  try {
    // Destructure email, password, and the role the user attempted to log in as
    const { email, password, role: intendedRole } = req.body; 

    if (!email || !password || !intendedRole) {
      return res.status(400).json({
        success: false,
        message: "email, password, and role are required",
      });
    }

    // 1. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // 2. Compare password
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    
    // 3. CRITICAL: ENFORCE ROLE MATCH
    if (user.role !== intendedRole) {
      return res
        .status(403)
        .json({ 
            success: false, 
            message: `Authentication failed. This account is registered as a **${user.role}**, not a ${intendedRole}. Please check the role you are signing in as.` 
        });
    }

    // 4. Generate token with the verified role
    const token = signToken(user.id, user.role);

    // 5. Success response
    return res.json({
      success: true,
      data: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return next(err);
  }
}