import { Card, PageHeader } from '@/components/admin/ui'
import { RecordManager } from '@/components/admin/RecordManager'
import { listRecords } from '@/lib/admin/records.server'

export const metadata = { title: 'Course category' }

export default async function CategoriesPage() {
  const records = await listRecords('category')
  return (
    <>
      <PageHeader title="Course category" />
      <Card title="Categories">
        <RecordManager model="category" records={records} />
      </Card>
    </>
  )
}
