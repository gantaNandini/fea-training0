import { Card, PageHeader } from '@/components/admin/ui'
import { RecordManager } from '@/components/admin/RecordManager'
import { listRecords } from '@/lib/admin/records.server'

export const metadata = { title: 'Coupons' }

export default async function CouponsPage() {
  const records = await listRecords('coupon')
  return (
    <>
      <PageHeader title="Coupons" />
      <Card title="Discount coupons">
        <RecordManager model="coupon" records={records} />
      </Card>
    </>
  )
}
