import { MailJetProvider } from "../../pkg/mail/mailjet.js";
import { env } from "../config/env.js";

// export const mailJetProvider = new MailJetProvider({
//   apikey :env.mailJet.apiKey,
//   apiSecret: env.mailJet.apiSecret,
//   fromEmail: env.mailJet.fromEmail,
//   fromMe: env.mailJet.fromMe


// })
export const mailJetProvider = new MailJetProvider({
  apiKey: env.mailJet.apiKey,
  apiSecret: env.mailJet.apiSecret,
  fromEmail: env.mailJet.fromEmail,
  fromMe: env.mailJet.fromMe
});