'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { messages } from '@/lib/messages'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

type Side = 'center' | 'left' | 'right' | 'bottom' | 'top'

const sideClasses: Record<Side, string> = {
  center:
    'left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-6',
  left: 'inset-y-0 left-0 h-full w-[85%] max-w-sm p-6',
  right: 'inset-y-0 right-0 h-full w-[85%] max-w-sm p-6',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl p-6',
  top: 'inset-x-0 top-0 p-4',
}

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: Side
  hideClose?: boolean
}

/** Dialog + Sheet in one: `side` positions it as a centred modal, a drawer or a bottom sheet. */
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent({ className, children, side = 'center', hideClose, ...props }, ref) {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/60" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'fixed z-50 border border-border bg-card text-foreground shadow-lg',
            sideClasses[side],
            className,
          )}
          {...props}
        >
          {children}
          {hideClose ? null : (
            <DialogPrimitive.Close
              aria-label={messages.common.close}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    )
  },
)
