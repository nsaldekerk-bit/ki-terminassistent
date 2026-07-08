import type { Mailer, MailInput } from "./types";

export class ConsoleMailer implements Mailer {
  async send(input: MailInput): Promise<void> {
    console.log("[mail:console] to=%s subject=%s", input.to, input.subject);
    console.log(input.text ?? input.html);
  }
}
