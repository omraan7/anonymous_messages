// import { config } from "dotenv";
// // Load environment variables from .env file
// config();
import "dotenv/config";

import "./lib/db/mongose.js";
import express from "express";
import authRouter from "./app/auth/auth.route.js";
import userRouter from "./app/user/user.route.js";
import messageRouter from "./app/message/message.route.js";
import { Otp } from "./app/auth/model/otp.model.js";
import e from "express";
import { env } from "./lib/config/env.js";
import { correlationId } from "./lib/corrlation/corrlationid.js";
import cookieParser from "cookie-parser";
// Create express app
const app = express();
// Middleware parsing buffer to json
app.use(express.json());
app.use(cookieParser());
app.use(correlationId);


// Routes for different modules
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/message", messageRouter);

// error handling middleware
app.use((err, req, res, next) => {
  console.log("kojonmjin", err.isOperational,req.correlationId);

  if (err.isOperational === true) {
    //err instanceof AppError
    return res.status(err.statusCode||500).json({ message: err.message });
  } else {
    console.log("kkk", err);

    return res.status(500).json({ message: "Something went wrong" });
  }
});

// Start the server
app.listen(env.port, () => console.log("server is running on port 3000"));

// cors ===>
