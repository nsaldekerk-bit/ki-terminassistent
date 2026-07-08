import { Resend } from "resend";
import type { Mailer, MailInput } from "./types";

export class ResendMailer implements Mailer {
  private client: Resend;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async send(input: MailInput): Promise<void> {
    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new Error("EMAIL_FROM must be set when EMAIL_PROVIDER=resend");
    }

    const { error } = await this.client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.message}`);
    }
  }
}
