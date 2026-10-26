import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const field =
  'block w-full rounded-md border border-slate-400 bg-card px-3 text-base text-foreground placeholder:text-slate-500 shadow-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60 aria-[invalid=true]:border-danger-text dark:border-slate-600'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(field, 'h-11', className)} {...props} />
  },
)

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(field, 'min-h-28 py-2', className)} {...props} />
})

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-foreground', className)} {...props} />
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger-text dark:text-red-300">
      {children}
    </p>
  )
}

/** Label + control + error wired together with ids (REQ-304). */
export function FormField({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string
  label: string
  error?: string | null
  hint?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode
}) {
  const errId = `${id}-error`
  const hintId = `${id}-hint`
  const described = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': described })}
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={errId}>{error}</FieldError>
    </div>
  )
}
