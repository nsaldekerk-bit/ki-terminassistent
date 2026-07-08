export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface Mailer {
  send(input: MailInput): Promise<void>;
}
