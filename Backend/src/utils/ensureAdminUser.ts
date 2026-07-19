import { User } from "../models/User";

export async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
    return;
  }

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
    console.log("✅ Default admin created:", admin.email);
  } else {
    console.log("✅ Admin exists:", admin.email);
  }
}
