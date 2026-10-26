import * as React from 'react'
import { PackageOpen } from 'lucide-react'

/** Simple illustration + message block used by empty cart/wishlist/compare/catalogue states. */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string
  body?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-plum-50 text-plum-700 dark:bg-plum-900 dark:text-plum-200">
        {icon ?? <PackageOpen className="h-10 w-10" aria-hidden="true" />}
      </div>
      <h2 className="text-xl">{title}</h2>
      {body ? <p className="text-muted-foreground">{body}</p> : null}
      {action}
    </div>
  )
}
