'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, Textarea } from '@/components/ui/input'
import { StarInput } from '@/components/shared/StarRating'
import { messages } from '@/lib/messages'

/** REQ-098: star + text; one review per student per course; created unapproved. */
export function ReviewForm({ courseId, onSubmitted }: { courseId: string; onSubmitted: () => void }) {
  const [rating, setRating] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) return setError('Please choose a star rating.')
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rating, comment }),
      })
      if (res.ok) {
        toast.success(messages.course.reviewSubmitted)
        onSubmitted()
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        setError(body.error?.message ?? messages.common.somethingWrong)
      }
    } catch {
      setError(messages.errors.network)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border border-border p-5">
      <h3 className="text-lg">{messages.course.writeReview}</h3>
      <div>
        <p className="mb-1 text-sm font-medium" id="rating-label">{messages.course.yourRating}</p>
        <StarInput value={rating} onChange={setRating} label={messages.course.yourRating} />
      </div>
      <FormField id="review-comment" label={messages.course.yourReview} error={error}>
        {(p) => <Textarea {...p} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />}
      </FormField>
      <Button type="submit" disabled={busy}>
        {messages.course.submitReview}
      </Button>
    </form>
  )
}
