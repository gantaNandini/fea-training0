import * as React from 'react'

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="container-page flex justify-center py-12 md:py-20">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
        <h1 className="text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
