'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { messages } from '@/lib/messages'

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" aria-hidden="true" /> {messages.checkout.print}
    </Button>
  )
}
