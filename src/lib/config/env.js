import nodemailer from "nodemailer";
import z from "zod";

// this file is used to check the environment variable exist or not and also check the type of the environment variable

export const envSchema = z.object({
  port: z.number().default(3000),
  MONGODB_URI: z.string().trim(),
  SMTP_USER: z.string().trim(),
  SMTP_PASS: z.string().trim(),
  JWT_SECRET: z.string().trim(),
  WEB_CLIENT_ID: z.string().trim(),
  REDIS_HOST: z.string().trim(),
  REDIS_PORT: z.string().trim().default("6379"),
  REDIS_PASSWORD: z.string().trim(),
MailJet_API_KEY: z.string().trim(),
  MailJet_API_SECRET: z.string().trim(),
  MailJet_FROM_EMAIL: z.string().trim(),
  MailJet_FROM_NAME: z.string().trim(),
  JWT_SECRET_refresh: z.string().trim(),
});
const envParsed = envSchema.parse(process.env);

export const env = {
  port: Number(envParsed.port),
  db: {
    url: envParsed.MONGODB_URI,
  },
  nodemailer: {
    smtpUser: envParsed.SMTP_USER,
    smtpPass: envParsed.SMTP_PASS,
  },
  jwt: {
    jwtSecret: envParsed.JWT_SECRET,
    jwtSecret_refresh: envParsed.JWT_SECRET_refresh,
  },
  webClientId: envParsed.WEB_CLIENT_ID,
  redis: {
    redisHost: envParsed.REDIS_HOST,
    redisPort: Number(envParsed.REDIS_PORT),
    redisPass: envParsed.REDIS_PASSWORD,
  },
  mailJet: {
    apiKey: envParsed.MailJet_API_KEY,
    apiSecret: envParsed.MailJet_API_SECRET,
    fromEmail: envParsed.MailJet_FROM_EMAIL,
    fromMe: envParsed.MailJet_FROM_NAME,
  },
};
