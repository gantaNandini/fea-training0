'use client'

import * as React from 'react'
import Link from 'next/link'
import { Linkedin, Globe, Twitter } from 'lucide-react'
import type { InstructorDTO } from '@/lib/types'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { messages } from '@/lib/messages'

/** Instructor card with computed aggregates and an expandable bio (REQ-096). */
export function InstructorCard({ instructor, link = true }: { instructor: InstructorDTO; link?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const bio = instructor.bio ?? ''
  const long = bio.length > 220
  return (
    <div className="flex flex-col gap-5 sm:flex-row" data-testid="instructor-card">
      <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
        <PlaceholderArt
          src={instructor.image ?? 'placeholder:avatar-instructor'}
          alt={`Portrait of ${instructor.name}`}
          label={instructor.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0">
        <h3 className="text-xl">
          {link ? (
            <Link href={`/instructors/${instructor.id}`} className="text-link underline-offset-4 hover:underline">
              {instructor.name}
            </Link>
          ) : (
            instructor.name
          )}
        </h3>
        {instructor.title ? <p className="text-sm text-muted-foreground">{instructor.title}</p> : null}
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li>
            <strong>{instructor.avgRating == null ? '—' : instructor.avgRating.toFixed(1)}</strong>{' '}
            <span className="text-muted-foreground">{messages.course.averageRating}</span>
          </li>
          <li>
            <strong>{instructor.reviews.toLocaleString('en-IN')}</strong>{' '}
            <span className="text-muted-foreground">{messages.course.reviews}</span>
          </li>
          <li>
            <strong>{instructor.students.toLocaleString('en-IN')}</strong>{' '}
            <span className="text-muted-foreground">{messages.course.students}</span>
          </li>
          <li>
            <strong>{instructor.courses}</strong> <span className="text-muted-foreground">{messages.course.courses}</span>
          </li>
        </ul>
        {bio ? (
          <p className={`mt-3 text-sm ${open || !long ? '' : 'line-clamp-3'}`}>{bio}</p>
        ) : null}
        {long ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="min-h-11 text-sm font-semibold text-link underline-offset-4 hover:underline"
          >
            {open ? messages.common.readLess : messages.common.readMore}
          </button>
        ) : null}
        {instructor.linkedin || instructor.twitter || instructor.website ? (
          <ul className="mt-2 flex gap-2">
            {instructor.linkedin ? (
              <li>
                <a href={instructor.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border hover:bg-muted">
                  <Linkedin className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            ) : null}
            {instructor.twitter ? (
              <li>
                <a href={instructor.twitter} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border hover:bg-muted">
                  <Twitter className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            ) : null}
            {instructor.website ? (
              <li>
                <a href={instructor.website} target="_blank" rel="noopener noreferrer" aria-label="Website" className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border hover:bg-muted">
                  <Globe className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
