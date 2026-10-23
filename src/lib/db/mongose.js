import mongoose from "mongoose";
import { env } from "../config/env.js";

 export const db = mongoose.connect(env.db.url );