import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getFreshUser } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Is direct-to-storage (Vercel Blob) configured? The admin editor asks this before choosing an upload path. */
export async function GET() {
  const user = await getFreshUser()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ enabled: false }, { status: 403 })
  return NextResponse.json({ enabled: !!process.env.BLOB_READ_WRITE_TOKEN })
}

/**
 * Token endpoint for browser -> Vercel Blob uploads. The file never passes through this server, so
 * there is no 4.5 MB serverless body limit and ANY file type or size (up to 5 GB) is accepted:
 * video, audio, PDF, Word/Excel/PowerPoint, ANSYS Workbench (.wbpj, .wbpz, .zip), CAD, archives…
 * Only signed-in admins can obtain an upload token.
 */
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage is not configured.' }, { status: 501 })
  }
  const body = (await req.json()) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const user = await getFreshUser()
        if (!user || user.role !== 'ADMIN') throw new Error('Admins only.')
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024,
          // no allowedContentTypes: every file type is accepted
        }
      },
      onUploadCompleted: async () => {
        /* nothing to do: the lesson stores the returned URL when the admin saves the course */
      },
    })
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
