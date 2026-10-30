import Link from 'next/link'
import { Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react'
import { Logo } from './Logo'
import { messages } from '@/lib/messages'
import type { SettingsMap } from '@/lib/types'

export function Footer({ settings }: { settings: SettingsMap }) {
  const year = new Date().getFullYear()
  const social = [
    { href: settings.social_linkedin, label: 'LinkedIn', Icon: Linkedin },
    { href: settings.social_youtube, label: 'YouTube', Icon: Youtube },
    { href: settings.social_twitter, label: 'X (Twitter)', Icon: Twitter },
  ].filter((s) => !!s.href)
  const link = 'inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground hover:underline'

  return (
    <footer className="site-footer mt-auto bg-surface-alt">
      {/* gradient top border (REQ-021) */}
      <div className="gradient-brand h-1" aria-hidden="true" />
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={settings.company_name ?? ''} />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{settings.footer_blurb}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {messages.footer.language}: <span className="font-medium text-foreground">{messages.common.english}</span>
          </p>
        </div>
        <nav aria-label={messages.footer.links}>
          <h2 className="mb-3 text-base">{messages.footer.links}</h2>
          <ul>
            <li><Link className={link} href="/about">{messages.footer.about}</Link></li>
            <li><Link className={link} href="/refund-policy">{messages.footer.refund}</Link></li>
            <li><Link className={link} href="/privacy-policy">{messages.footer.privacy}</Link></li>
            <li><Link className={link} href="/terms">{messages.footer.terms}</Link></li>
            <li><Link className={link} href="/login">{messages.footer.login}</Link></li>
            <li><Link className={link} href="/admin-login" data-testid="admin-login-link">Admin login</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 text-base">{messages.footer.contact}</h2>
          <address className="space-y-2 text-sm not-italic text-muted-foreground">
            <p className="font-medium text-foreground">{settings.company_name}</p>
            {settings.address ? (
              <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{settings.address}</p>
            ) : null}
            {settings.email ? (
              <p className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a className="underline-offset-4 hover:underline" href={`mailto:${settings.email}`}>{settings.email}</a></p>
            ) : null}
            {settings.phone ? (
              <p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a className="underline-offset-4 hover:underline" href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></p>
            ) : null}
          </address>
        </div>
        <div>
          <h2 className="mb-3 text-base">{messages.footer.company}</h2>
          <Link className={link} href="/contact">{messages.footer.contactUs}</Link>
          {social.length > 0 ? (
            <ul className="mt-3 flex gap-2">
              {social.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border hover:bg-muted"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-4 text-sm text-muted-foreground">
          © {year} {settings.company_name}. {messages.footer.rights}
        </p>
      </div>
    </footer>
  )
}
