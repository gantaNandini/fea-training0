'use client'

import { Button } from '@/components/ui/button'
import { messages } from '@/lib/messages'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-3xl">{messages.errors.errorTitle}</h1>
      <p className="max-w-md text-muted-foreground">{messages.errors.errorBody}</p>
      {error.digest ? <p className="text-xs text-muted-foreground">Reference: {error.digest}</p> : null}
      <Button onClick={reset}>{messages.common.tryAgain}</Button>
    </main>
  )
}
