import { SmtpEmailProvider } from './smtp'

/** REQ-007: email goes through an interface so SES/Resend/SMTP can replace the console adapter. */
export interface EmailMessage {
  to: string
  subject: string
  text: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>
}

export const emailProvider: EmailProvider = new SmtpEmailProvider()
