'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SearchBar } from './SearchBar'
import { messages } from '@/lib/messages'

/** Below 1024 px the search bar collapses into an icon that opens a top sheet (REQ-036). */
export function MobileSearch() {
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={messages.nav.search} className="lg:hidden">
          <Search className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent side="top" aria-describedby={undefined} className="pt-14" hideClose={false}>
        <DialogTitle className="sr-only">{messages.nav.search}</DialogTitle>
        <SearchBar autoFocus onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
