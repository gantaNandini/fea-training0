import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function SectionHeader({
  title,
  subtitle,
  linkHref,
  linkLabel,
  className,
  id,
  as: Tag = 'h2',
}: {
  title: string
  subtitle?: string
  linkHref?: string
  linkLabel?: string
  className?: string
  id?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        <Tag id={id}>{title}</Tag>
        {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {linkHref && linkLabel ? (
        <Link
          href={linkHref}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-link underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}
