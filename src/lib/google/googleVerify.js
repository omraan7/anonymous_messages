import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
const clint = new OAuth2Client();

  export const verifyAccountGoogle = async (idToken) => {
      const ticket = await clint.verifyIdToken({
    idToken,
    audience: env.webClientId,
  });
  console.log(ticket);
  const payload = ticket.getPayload();
  console.log(payload);
  return payload;
  };