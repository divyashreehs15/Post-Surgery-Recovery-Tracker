import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import recoveryRoutes from "./routes/recoveryRoutes";
import authRoutes from "./routes/authRoutes";
import medicationRoutes from "./routes/medicationRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import adminRoutes from "./routes/adminRoutes";
import userRoutes from "./routes/userRoutes";
import patientRoutes from "./routes/patientRoutes"
import notificationRoutes from "./routes/notificationRoutes";
import "./scheduler/notificationScheduler";
import assignmentRoutes from "./routes/assignmentRoutes";
import recordRoutes from "./routes/recordsRoutes";
import notesRoutes from "./routes/notesRoutes";


const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.join(process.cwd(), uploadDir)));
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/admin/assignments", assignmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/records", recordRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/notes", notesRoutes);




app.use(notFoundHandler);
app.use(errorHandler);

export default app;
