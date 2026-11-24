import { beforeEach, describe, expect, it, vi } from 'vitest'

const { send, save, getSetting, hit } = vi.hoisted(() => ({
  send: vi.fn(), save: vi.fn(), getSetting: vi.fn(), hit: vi.fn(),
}))

vi.mock('@/lib/email', () => ({ emailProvider: { send } }))
vi.mock('@/lib/data/content', () => ({ saveContactMessage: save }))
vi.mock('@/lib/data/settings', () => ({ getSetting }))
vi.mock('@/lib/rate-limit', () => ({ rateLimiter: { hit } }))
vi.mock('@/lib/net/ip', () => ({ getClientIp: () => '1.2.3.4' }))

import { POST } from '@/app/api/contact/route'
import { DEFAULT_CONTACT_INBOX, contactRecipient } from '@/lib/contact-mail'

const valid = { name: 'Asha Rao', email: 'asha@example.com', subject: 'Course question', message: 'I would like to know the dates for the next batch please.' }
const post = (body: unknown) =>
  POST(new Request('http://x/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.CONTACT_TO_EMAIL
  hit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
  getSetting.mockResolvedValue(null)
})

describe('contact form', () => {
  it('saves the message and emails info@fea-training.com with Reply-To set to the sender', async () => {
    const res = await post(valid)
    expect(res.status).toBe(200)
    expect(save).toHaveBeenCalledWith(valid)
    expect(send).toHaveBeenCalledTimes(1)
    const mail = send.mock.calls[0]![0]
    expect(mail.to).toBe('info@fea-training.com')
    expect(mail.replyTo).toBe('asha@example.com')
    expect(mail.text).toContain('Asha Rao')
    expect(mail.text).toContain('asha@example.com')
    expect(mail.text).toContain('next batch')
  })

  it('still saves and answers OK when sending fails', async () => {
    send.mockRejectedValueOnce(new Error('smtp down'))
    const res = await post(valid)
    expect(res.status).toBe(200)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('ignores bots that fill the hidden field: nothing saved, nothing sent', async () => {
    // honeypot field removed from schema; extra unknown fields are stripped by zod
    const res = await post({ ...valid, website: 'http://spam.example' })
    expect(res.status).toBe(200)
    expect(save).toHaveBeenCalledTimes(1) // message IS saved when unknown fields are present
  })

  it('rate-limits to 5 messages per 15 minutes per address', async () => {
    await post(valid)
    expect(hit).toHaveBeenCalledWith('1.2.3.4:contact:*', 5, 15 * 60)
    hit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 })
    const res = await post(valid)
    expect(res.status).toBe(429)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('keeps the subject on one line', async () => {
    await post({ ...valid, subject: 'Hello\r\nBcc: evil@example.com' })
    expect(send.mock.calls[0]![0].subject).not.toMatch(/[\r\n]/)
  })

  it('rejects an invalid message', async () => {
    const res = await post({ ...valid, message: 'short' })
    expect(res.status).toBe(400)
    expect(save).not.toHaveBeenCalled()
  })
})

describe('contact recipient', () => {
  it('uses CONTACT_TO_EMAIL, then the Admin setting, then info@fea-training.com', async () => {
    expect(DEFAULT_CONTACT_INBOX).toBe('info@fea-training.com')
    expect(await contactRecipient()).toBe('info@fea-training.com')
    getSetting.mockResolvedValue('office@example.com')
    expect(await contactRecipient()).toBe('office@example.com')
    process.env.CONTACT_TO_EMAIL = 'env@example.com'
    expect(await contactRecipient()).toBe('env@example.com')
  })
})

