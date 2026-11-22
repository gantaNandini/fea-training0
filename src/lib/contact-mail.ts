import { getSetting } from '@/lib/data/settings'

/** Used when neither CONTACT_TO_EMAIL nor the Admin "Contact email" setting is filled in. */
export const DEFAULT_CONTACT_INBOX = 'info@fea-training.com'

/** Recipient of contact-form mail: CONTACT_TO_EMAIL, else the Admin "Contact email" setting, else the default inbox. */
export async function contactRecipient(): Promise<string> {
  return process.env.CONTACT_TO_EMAIL?.trim() || (await getSetting('email'))?.trim() || DEFAULT_CONTACT_INBOX
}

/** Header values must stay on one line. */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()
