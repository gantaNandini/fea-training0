import { ButtonLink } from '@/components/ui/button'
import { messages } from '@/lib/messages'

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-display text-6xl font-extrabold text-plum-700 dark:text-plum-300" aria-hidden="true">404</p>
      <h1 className="text-3xl">{messages.errors.notFoundTitle}</h1>
      <p className="max-w-md text-muted-foreground">{messages.errors.notFoundBody}</p>
      <div className="flex gap-3">
        <ButtonLink href="/">{messages.common.backHome}</ButtonLink>
        <ButtonLink href="/courses" variant="outline">{messages.common.browseCourses}</ButtonLink>
      </div>
    </main>
  )
}
