import { Card, PageHeader } from '@/components/admin/ui'
import { MessageInbox } from '@/components/admin/MessageInbox'
import { db } from '@/lib/db'

export const metadata = { title: 'Message' }

export default async function MessagePage() {
  const rows = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 300 })
  return (
    <>
      <PageHeader title="Message" />
      <Card>
        <MessageInbox
          messages={rows.map((m) => ({ id: m.id, name: m.name, email: m.email, subject: m.subject, message: m.message, read: m.read, date: m.createdAt.toLocaleString('en-IN') }))}
        />
      </Card>
    </>
  )
}
