import path from "path";
import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { connectToDatabase } from "./config/db";



// ✅ Load .env from project root (works for both src & dist)
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// ✅ Log to verify
console.log("✅ Loaded .env from:", envPath);
console.log("🔐 JWT_SECRET:", process.env.JWT_SECRET || "❌ Missing!");

// Environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const MONGO_URI = process.env.MONGO_URI || "";

async function start() {
  try {
    await connectToDatabase(MONGO_URI);
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌿 Connected to MongoDB at: ${MONGO_URI}`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "Loaded" : "Missing!"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
