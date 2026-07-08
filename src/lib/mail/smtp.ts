import nodemailer from "nodemailer";
import type { Mailer, MailInput } from "./types";

export class SmtpMailer implements Mailer {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    if (!host) {
      throw new Error("SMTP_HOST must be set when EMAIL_PROVIDER=smtp");
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }

  async send(input: MailInput): Promise<void> {
    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new Error("EMAIL_FROM must be set when EMAIL_PROVIDER=smtp");
    }

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}
