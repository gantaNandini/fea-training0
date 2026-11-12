import { Card, PageHeader } from '@/components/admin/ui'
import { RecordManager } from '@/components/admin/RecordManager'
import { listRecords } from '@/lib/admin/records.server'

export const metadata = { title: 'Consultancy projects' }

export default async function ProjectsAdminPage() {
  const records = await listRecords('project')
  return (
    <>
      <PageHeader title="Consultancy projects" />
      <Card title="Add the projects shown on the Consultancy page">
        <p className="mb-4 max-w-2xl text-sm text-slate-600">
          Each project appears on <em>Consultancy → Projects</em>. Projects with the same <strong>Tab / category</strong> are grouped under one tab,
          and the first few are also shown on the home page. Set a lower display order to show a project first.
        </p>
        <RecordManager model="project" records={records} />
      </Card>
    </>
  )
}
