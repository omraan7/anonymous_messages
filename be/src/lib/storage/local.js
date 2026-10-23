import fs from "fs/promises";
import path from "path";
import { env } from "../config/env.js";

// Local-disk storage driver. NOTE: serverless platforms (e.g. Vercel) have no
// persistent disk. Production there needs an object-storage driver exposing the same
// three functions (save / remove / url); nothing else in the app touches the disk.
export const uploadRoot = path.resolve(env.uploadDir);
const SAFE_KEY = /^[A-Za-z0-9_-]{8,80}\.webp$/;

export const isSafeKey = (key) => typeof key === "string" && SAFE_KEY.test(key);
export const publicUrl = (key) => `${env.apiPrefix}/uploads/${key}`;

export async function save(key, buffer) {
  if (!isSafeKey(key)) throw new Error("unsafe storage key");
  await fs.mkdir(uploadRoot, { recursive: true });
  await fs.writeFile(path.join(uploadRoot, key), buffer, { flag: "wx" });
  return { key, url: publicUrl(key) };
}

export async function remove(key) {
  if (!isSafeKey(key)) return; // never touch anything we did not create
  await fs.rm(path.join(uploadRoot, key), { force: true });
}
