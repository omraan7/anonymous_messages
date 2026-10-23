import nodemailer from "nodemailer";
import { env } from "../config/env.js";


  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
    auth: {
      user:env.nodemailer.smtpUser ,
      pass: env.nodemailer.smtpPass,
    },
  });

export const sendEmail = async (to, subject, html) => {
  // Create a transporter using SMTP

try {
  const info = await transporter.sendMail({
    from: '"Omran" <${env.nodemailer.smtpUser}>', // sender address
    to: to, // list of recipients
    subject: subject, // subject line
    html: html, // HTML body
  }, function (err, info) {
    if (err) {
    next(err);
    } 
  });

  // console.log("Message sent: %s", info.messageId);
  // // Preview URL is only available when using an Ethereal test account
  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
} catch (err) {
  console.error("Error while sending mail:", err);
}
};
