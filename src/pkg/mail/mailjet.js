import mailjet from "node-mailjet";
export class MailJetProvider {
  clint;
  fromEmail;
  fromMe;

  constructor(config) {
    this.clint = new mailjet({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
    this.fromEmail = config.fromEmail;
    this.fromMe = config.fromMe;
  }
  sendEmail(email, subject, html) {
    this.clint.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: this.fromEmail ,
            Name: this.fromMe,
          },
          To: [
            {
              Email: email,
            
            },
          ],
          Subject: subject,
          TextPart: "Greetings from Mailjet!",
          HTMLPart:
            html,
        },
      ],
    });
  }
}
