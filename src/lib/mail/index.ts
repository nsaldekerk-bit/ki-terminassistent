import { ConsoleMailer } from "./console";
import { ResendMailer } from "./resend";
import { SmtpMailer } from "./smtp";
import type { Mailer } from "./types";

export type { Mailer, MailInput } from "./types";

let cachedMailer: Mailer | null = null;

export function getMailer(): Mailer {
  if (cachedMailer) return cachedMailer;

  const provider = process.env.EMAIL_PROVIDER ?? "console";

  switch (provider) {
    case "resend":
      cachedMailer = new ResendMailer();
      break;
    case "smtp":
      cachedMailer = new SmtpMailer();
      break;
    default:
      cachedMailer = new ConsoleMailer();
  }

  return cachedMailer;
}
