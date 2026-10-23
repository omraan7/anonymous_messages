import mongoose from "mongoose";
import { env } from "../config/env.js";

mongoose.set("sanitizeFilter", true); // blocks NoSQL operator injection in filters built from user input

export const connectDb = () =>
  mongoose.connect(env.db.url, { serverSelectionTimeoutMS: 8000 });
export const disconnectDb = () => mongoose.disconnect();
