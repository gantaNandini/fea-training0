import nodemailer from 'nodemailer'
import { db } from '@/lib/db'
import type { EmailMessage, EmailProvider } from './index'
import { ConsoleEmailProvider } from './console'

interface SmtpConfig {
  host: string
  port: number
  user?: string
  password?: string
  from?: string
}

/**
 * SMTP settings come from environment variables first (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
 * SMTP_FROM — set them in Vercel, never in the repo), then from Admin → Settings → SMTP (SiteSetting rows).
 * Returns null when no host is configured anywhere.
 */
export async function loadSmtpConfig(env: Record<string, string | undefined> = process.env): Promise<SmtpConfig | null> {
  if (env.SMTP_HOST?.trim()) {
    return {
      host: env.SMTP_HOST.trim(),
      port: Number(env.SMTP_PORT) || 587,
      user: env.SMTP_USER?.trim() || undefined,
      password: env.SMTP_PASSWORD ?? '',
      from: env.SMTP_FROM?.trim() || env.SMTP_USER?.trim() || undefined,
    }
  }
  const rows = await db.siteSetting.findMany({ where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from'] } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  if (!s.smtp_host) return null
  return {
    host: s.smtp_host,
    port: Number(s.smtp_port) || 587,
    user: s.smtp_user || undefined,
    password: s.smtp_password ?? '',
    from: s.smtp_from || s.smtp_user || undefined,
  }
}

/** With no SMTP host anywhere it falls back to the console provider, so local dev never needs SMTP. */
export class SmtpEmailProvider implements EmailProvider {
  private fallback = new ConsoleEmailProvider()

  async send(message: EmailMessage): Promise<void> {
    const cfg = await loadSmtpConfig()
    if (!cfg) return this.fallback.send(message)
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: cfg.user ? { user: cfg.user, pass: cfg.password ?? '' } : undefined,
    })
    await transport.sendMail({
      from: cfg.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
    })
  }
}
