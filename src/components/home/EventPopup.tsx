'use client'

import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EventRegistrationForm } from '@/components/events/EventRegistrationForm'

export interface EventPopupProps {
  eventId: string
  type: string
  title: string
  when: string
  online: boolean
  summary: string | null
  image: string | null
  registrable: boolean
}

/** One compact row on the home page. Clicking it opens a pop-up with the details and the register form. */
export function EventPopup({ eventId, type, title, when, online, summary, image, registrable }: EventPopupProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted focus-visible:outline focus-visible:outline-2"
        >
          <span className="shrink-0 rounded-full bg-plum-700 px-2.5 py-0.5 text-xs font-semibold text-white">{type}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{title}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {when}
              {online ? ' · Online' : ''}
            </span>
          </span>
          <span className="shrink-0 rounded-md bg-plum-700 px-3 py-1.5 text-sm font-semibold text-white">{registrable ? 'Register now' : 'Details'}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle className="pr-10 font-display text-xl font-bold leading-snug">{title}</DialogTitle>
        <DialogDescription className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
          {when}
          {online ? ' · Online' : ''}
        </DialogDescription>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- small decorative flyer preview inside the pop-up
          <img src={image} alt={`${title} flyer`} className="mt-4 max-h-56 w-full rounded-lg border border-border object-cover object-top" />
        ) : null}
        {summary ? <p className="mt-3 text-sm">{summary}</p> : null}
        {registrable ? (
          <div className="mt-5">
            <EventRegistrationForm eventId={eventId} eventTitle={title} />
          </div>
        ) : null}
        <p className="mt-4 text-sm">
          <Link href={`/events/${eventId}`} className="font-semibold text-link underline-offset-4 hover:underline">
            Full details
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
