import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailPayload) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,              // ✔ Use 587 (TLS START) — stable
    secure: false,          // ✔ Must be false for port 587
    auth: {
      user: process.env.EMAIL_USER,  // gmail
      pass: process.env.EMAIL_PASS,  // app password
    },
  });

  return transporter.sendMail({
    from: `"Synara PostSurgery App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
