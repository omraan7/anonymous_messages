import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// In tests, mail is captured here instead of being sent.
export const testOutbox = [];

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
};

// Returns true/false. Never throws: callers must not leak delivery state to clients.
export const sendEmail = async (to, subject, html) => {
  if (env.isTest) {
    testOutbox.push({ to, subject, html });
    return true;
  }
  if (!env.smtp.user) {
    console.error("[mail] SMTP_USER/SMTP_PASS not configured; email not sent");
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: `"Saraha" <${env.smtp.user}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err.code || err.message);
    return false;
  }
};
