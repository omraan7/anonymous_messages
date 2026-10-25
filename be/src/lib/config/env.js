import { z } from "zod";

// Validates every environment variable once, at startup. Fails fast with a
// readable list of problems (variable NAMES only, never values).
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);
const bool = (def) =>
  z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? def : v === "true"));

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().trim().default("/api"),
  // Comma separated list of browser origins allowed to call the API with cookies.
  FRONTEND_ORIGINS: z.string().trim().default("http://localhost:3000"),
  // Number of reverse proxies in front of the API (Next rewrite / Vercel / nginx).
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  MONGODB_URI: z.string().trim().min(1),

  JWT_SECRET: z.string().trim().min(32, "must be at least 32 characters"),
  // Re-used as the HMAC "pepper" for hashing opaque refresh tokens and OTPs.
  JWT_SECRET_refresh: z
    .string()
    .trim()
    .min(32, "must be at least 32 characters"),

  // Google Sign-In: the OAuth *Web client ID* whose ID tokens we accept.
  WEB_CLIENT_ID: optionalString,

  // Redis is optional. Without it sessions fall back to MongoDB only.
  REDIS_HOST: optionalString,
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: optionalString,
  REDIS_TLS: bool(false),

  SMTP_HOST: z.string().trim().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,

  // Present in the original project; the Mailjet provider is kept but not wired in.
  MailJet_API_KEY: optionalString,
  MailJet_API_SECRET: optionalString,
  MailJet_FROM_EMAIL: optionalString,
  MailJet_FROM_NAME: optionalString,

  UPLOAD_DIR: z.string().trim().default("Uploads"),
  COOKIE_DOMAIN: optionalString,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${problems}`);
  process.exit(1);
}
const e = parsed.data;
const isProd = e.NODE_ENV === "production";

export const env = {
  nodeEnv: e.NODE_ENV,
  isProd,
  isTest: e.NODE_ENV === "test",
  port: e.PORT,
  apiPrefix: e.API_PREFIX.replace(/\/+$/, ""),
  trustProxy: e.TRUST_PROXY,
  frontendOrigins: e.FRONTEND_ORIGINS.split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  db: { url: e.MONGODB_URI },
  jwt: { jwtSecret: e.JWT_SECRET, jwtSecret_refresh: e.JWT_SECRET_refresh },
  webClientId: e.WEB_CLIENT_ID,
  redis: e.REDIS_HOST
    ? {
        host: e.REDIS_HOST,
        port: e.REDIS_PORT,
        password: e.REDIS_PASSWORD,
        tls: e.REDIS_TLS,
      }
    : null,
  smtp: {
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    user: e.SMTP_USER,
    pass: e.SMTP_PASS,
  },
  mailJet: {
    apiKey: e.MailJet_API_KEY,
    apiSecret: e.MailJet_API_SECRET,
    fromEmail: e.MailJet_FROM_EMAIL,
    fromMe: e.MailJet_FROM_NAME,
  },
  uploadDir: e.UPLOAD_DIR,
  cookieDomain: e.COOKIE_DOMAIN,
  // Access token lifetime / refresh lifetime (seconds).
  accessTtlSec: 15 * 60,
  refreshTtlSec: 7 * 24 * 3600,
  refreshAbsoluteTtlSec: 30 * 24 * 3600,
  // Window in which a re-used (just rotated) refresh token is treated as a benign
  // double-submit race instead of theft.
  refreshGraceSec: 10,
  // Upper bound on how stale the Redis "session is active" marker can be.
  sessionCacheTtlSec: 60,
};
