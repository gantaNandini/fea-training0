import type { EmailMessage, EmailProvider } from './index'

/** Demo adapter (Phase 1.5 stub): prints the email to the server console. */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log(
      `\n[email:console] To: ${message.to}\n[email:console] Subject: ${message.subject}\n${message.text}\n`,
    )
  }
}
