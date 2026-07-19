import cron from "node-cron";
import Notification from "../models/Notification.js";
import { Appointment } from "../models/Appointment.js";
import { User } from "../models/User.js";
import { Medication } from "../models/Medication.js";
import { sendEmail } from "../utils/sendEmail.js";

function scheduleSnoozeReminder(
  medId: string,
  userId: string,
  medName: string,
  dosage: string,
  minutes: number = 15
): void {
  const delay = Math.max(1, minutes) * 60 * 1000; // ensure >=1 minute

  console.log(`DEBUG: scheduleSnoozeReminder called medId=${medId} userId=${userId} delayMinutes=${minutes}`);

  // For fast testing: Use minutes = 0.1 (6 seconds)
  setTimeout(async () => {
    console.log(`DEBUG: snooze timeout fired for medId=${medId} userId=${userId}`);

    try {
      const medication = await Medication.findById(medId).populate("userId");

      if (!medication) {
        console.log(`DEBUG: Snooze – medication ${medId} not found.`);
        return;
      }

      console.log(
        `DEBUG: Snooze – medication found enabled=${!!medication.enabled} lastTaken=${medication.lastTaken}`
      );

      if (!medication.enabled) {
        console.log(`DEBUG: Snooze – medication disabled, abort.`);
        return;
      }

      // lastTaken check...
      const lastTakenTs = medication.lastTaken
        ? new Date(medication.lastTaken).getTime()
        : 0;

      const sinceLastTakenMin = lastTakenTs
        ? (Date.now() - lastTakenTs) / (60 * 1000)
        : Infinity;

      console.log(`DEBUG: Snooze – sinceLastTakenMin=${sinceLastTakenMin}`);

      if (lastTakenTs && sinceLastTakenMin < minutes) {
        console.log(
          `DEBUG: Snooze skipped – med was taken ${sinceLastTakenMin.toFixed(1)} min ago`
        );
        return;
      }

      // Duplicate check window for testing
      const duplicateWindowMs = 1 * 60 * 1000; // 1 min
      const existingNotification = await Notification.findOne({
        userId,
        type: "medication",
        message: { $regex: medName, $options: "i" },
        time: { $gte: new Date(Date.now() - duplicateWindowMs) },
      });

      console.log(
        "DEBUG: Snooze – existingNotification =",
        !!existingNotification
      );

      if (existingNotification) {
        console.log(`DEBUG: Snooze skipped – duplicate exists.`);
        return;
      }

      // ===============================
      // CREATE SNOOZE NOTIFICATION
      // ===============================
      const created = await Notification.create({
        userId,
        title: "Medication Reminder (Snooze)",
        message: `⏰ Reminder: Take your medication ${medName} (${dosage})`,
        type: "medication",
        priority: "important",
        time: new Date(),
      });

      console.log(
        `DEBUG: Snooze notification CREATED id=${created._id} for user=${userId}`
      );

      // ===============================
      // OPTIONAL EMAIL
      // ===============================
      const user: any = medication.userId;
      if (user?.notificationSettings?.emailReminders && user.email) {
        try {
          const info = await sendEmail({
            to: user.email,
            subject: `Snooze Reminder: ${medName}`,
            text: `Please take your medication: ${medName} (${dosage}).`,
            html: `<p><b>Snooze Reminder</b></p><p>Please take your medication: <b>${medName}</b> (${dosage}).</p>`,
          });

          console.log("DEBUG: Snooze email SENT → ", info);
        } catch (error) {
          console.error("DEBUG: Snooze email FAILED →", error);
        }
      }
    } catch (err) {
      console.error("DEBUG: Snooze ERROR →", err);
    }
  }, delay);
}

// =====================================================
// 1️⃣ Appointment Reminder (Every minute) – ALWAYS send email + notification
// =====================================================
cron.schedule(
  "*/1 * * * *",
  async () => {
    console.log("⏰ Checking for upcoming appointments...");

    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      console.log("Checking appointments between:", now, "and", oneHourLater);

      // Populate userId for email + info
      const upcomingAppointments = await Appointment.find({
        dateTime: {
          $gte: now,
          $lte: oneHourLater,
        },
      }).populate("userId");

      console.log(`🗓 Found ${upcomingAppointments.length} upcoming appointments.`);

      for (const appt of upcomingAppointments) {
        const user = appt.userId as any;

        if (!user) {
          console.log(`⚠️ Appointment ${appt._id} has no user — skipping.`);
          continue;
        }

        const userId = user._id.toString();

        // Prevent duplicate spam within 1 hour
        const exists = await Notification.findOne({
          userId,
          type: "appointment",
          time: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
        });

        if (!exists) {
          // -------------------------------------------------
          // 1. Create PUSH/APP notification (always enabled)
          // -------------------------------------------------
          await Notification.create({
            userId,
            title: "Appointment Reminder",
            message: `You have an appointment "${appt.title}" with Dr. ${appt.doctor} at ${new Date(
              appt.dateTime
            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
            type: "appointment",
            priority: "important",
            time: new Date(),
          });

          console.log(`🔔 Appointment push notification created for ${userId}`);

          // -------------------------------------------------
          // 2. EMAIL notification (ALWAYS send)
          // -------------------------------------------------
          if (user.email) {
            const apptDateStr = new Date(appt.dateTime).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            try {
              await sendEmail({
                to: user.email,
                subject: `Appointment Reminder: ${appt.title} — ${apptDateStr}`,
                text: `This is a reminder for your appointment "${appt.title}" with Dr. ${appt.doctor} at ${apptDateStr}.`,
                html: `
                  <h3>Appointment Reminder</h3>
                  <p><b>Appointment:</b> ${appt.title}</p>
                  <p><b>Doctor:</b> ${appt.doctor}</p>
                  <p><b>Time:</b> ${apptDateStr} (Asia/Kolkata)</p>
                  <hr/>
                  <small>Synara PostSurgery App – Automated Notification</small>
                `,
              });

              console.log(`✉️ Appointment email sent to ${user.email}`);
            } catch (error) {
              console.error("❌ Error sending appointment email:", error);
            }
          } else {
            console.log(`⚠️ No email found for user ${userId}, skipping email.`);
          }
        } else {
          console.log(`⏭️ Skipping duplicate reminder for "${appt.title}"`);
        }
      }
    } catch (err) {
      console.error("❌ Appointment cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" }
);


// =====================================================
// 2️⃣ Medication Reminder (Every minute check)
// =====================================================
// ✅ REPLACE the entire medication reminder cron job:
cron.schedule("*/1 * * * *", async () => {
  console.log("💊 Checking for due medications...");
  const now = new Date();
  const upcomingTime = new Date(now.getTime() + 10 * 60 * 1000);

  try {
    // ✅ ADD .populate('userId') here:
    const dueMeds = await Medication.find({
      nextDose: { $lte: upcomingTime },
      enabled: true,
    }).populate('userId');

    console.log(`🧾 Found ${dueMeds.length} due medications.`);

    for (const med of dueMeds) {
       if (!med.enabled) {
        console.log(`⛔ Medication ${med.name} is OFF → skipping all reminders`);
        continue;
    }
      const user = med.userId as any;
      const userId = user._id.toString();
      
      // ✅ Get user's notification settings:
      const settings = user.notificationSettings || {
        pushNotifications: true,
        emailReminders: false,
        smartSnooze: true
      };

      console.log(`➡️ Processing ${med.name} for user ${userId}`);
      console.log(`📱 Settings:`, settings);

      const exists = await Notification.findOne({
        userId,
        type: "medication",
        message: { $regex: med.name, $options: "i" },
        time: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
      });

      if (!exists) {
        // ✅ Only create push notification if enabled:
        if (settings.pushNotifications) {
          try {
            await Notification.create({
              userId,
              title: "Medication Reminder",
              message: `💊 Time to take your medication: ${med.name} (${med.dosage}).`,
              type: "medication",
              priority: "important",
              time: new Date(),
            });
            console.log(`✅ Push notification created for ${userId}`);
          } catch (error) {
            console.error(`❌ Failed to create push notification:`, error);
          }
        }

        // ✅ Only send email if enabled:
        if (settings.emailReminders && user.email) {
  await sendEmail({
    to: user.email,
    subject: "Medication Reminder",
    text: `Time to take your medication: ${med.name} (${med.dosage})`,
    html: `
      <h2>Medication Reminder</h2>
      <p>It's time to take your medication:</p>
      <b>${med.name}</b> - ${med.dosage}
      <br/><br/>
      <small>This is an automated reminder.</small>
    `
  });
}


        // ✅ Schedule snooze if enabled:
        // inside your medication loop, after sending push/email:
if (settings.smartSnooze) {
  console.log(`⏰ Snooze reminder scheduled for ${userId}`);
  // safe string conversion
scheduleSnoozeReminder(String((med as any)._id), userId, med.name, med.dosage, 2);

}


        // Update nextDose (keep your existing logic)
        const freq = med.frequency.toLowerCase();
        if (freq.includes("twice") && freq.includes("daily")) {
          med.nextDose = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        } else if (freq.includes("thrice") && freq.includes("daily")) {
          med.nextDose = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        } else if (freq.includes("every 4")) {
          med.nextDose = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        } else if (freq.includes("every 6")) {
          med.nextDose = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        } else if (freq.includes("every 8")) {
          med.nextDose = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        } else if (freq.includes("once") && freq.includes("daily")) {
          med.nextDose = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (freq.includes("daily")) {
          med.nextDose = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else {
          med.nextDose = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }

        await med.save();
      } else {
        console.log(`⏭️ Skipping duplicate reminder for ${med.name}`);
      }
    }
  } catch (err) {
    console.error("🚨 Error in medication scheduler:", err);
  }
});
// =====================================================
// 3️⃣ Daily Log Reminder (9 AM)
// =====================================================
cron.schedule("0 11 * * *", async () => {
  console.log("📘 Sending daily log reminders...");
  const users = await User.find();

  for (const user of users) {
    await Notification.create({
      userId: user._id,
      title: "Daily Log Entry",
      message: "Don't forget to log your recovery progress for today.",
      type: "reminder",
      priority: "normal",
      time: new Date(),
    });
  }
});

// =====================================================
// 4️⃣ Weekly Photo Reminder (Monday 10 AM)
// =====================================================
cron.schedule("0 11 * * 5", async () => {
  console.log("📸 Sending weekly photo reminder...");
  const users = await User.find();

  for (const user of users) {
    await Notification.create({
      userId: user._id,
      title: "Upload Weekly Progress Photo",
      message: "Please upload a photo of your wound for this week's assessment.",
      type: "upload",
      priority: "normal",
      time: new Date(),
    });
  }
});