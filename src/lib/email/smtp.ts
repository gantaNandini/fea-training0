import nodemailer from 'nodemailer'
import { db } from '@/lib/db'
import type { EmailMessage, EmailProvider } from './index'
import { ConsoleEmailProvider } from './console'

/**
 * Sends through SMTP using the credentials saved in Admin → Settings → SMTP (SiteSetting rows).
 * With no host configured it falls back to the console provider, so local dev never needs SMTP.
 */
export class SmtpEmailProvider implements EmailProvider {
  private fallback = new ConsoleEmailProvider()

  async send(message: EmailMessage): Promise<void> {
    const rows = await db.siteSetting.findMany({ where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from'] } } })
    const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    if (!s.smtp_host) return this.fallback.send(message)
    const port = Number(s.smtp_port) || 587
    const transport = nodemailer.createTransport({
      host: s.smtp_host,
      port,
      secure: port === 465,
      auth: s.smtp_user ? { user: s.smtp_user, pass: s.smtp_password ?? '' } : undefined,
    })
    await transport.sendMail({
      from: s.smtp_from || s.smtp_user,
      to: message.to,
      subject: message.subject,
      text: message.text,
    })
  }
}
