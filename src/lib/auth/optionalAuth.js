import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;

//  anonymous user
  if (!token) {
    return next();
  }

  try {
  req.user = jwt.verify(token, env.jwt.jwtSecret);
    next();
  } catch (error) {
    next();
  }
};