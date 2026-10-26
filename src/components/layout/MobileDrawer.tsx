'use client'

import * as React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Menu } from 'lucide-react'
import type { CategoryDTO } from '@/lib/types'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button, ButtonLink } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useUserState } from '@/hooks/useUserState'
import { messages } from '@/lib/messages'

/** Hamburger -> full-height drawer with all navigation (REQ-036). */
export function MobileDrawer({ categories, companyName }: { categories: CategoryDTO[]; companyName: string }) {
  const [open, setOpen] = React.useState(false)
  const { user } = useUserState()
  const link = 'flex min-h-11 items-center rounded-md px-2 font-medium hover:bg-muted'
  const close = () => setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={messages.nav.openMenu} className="lg:hidden">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent side="left" aria-describedby={undefined} className="flex flex-col overflow-y-auto">
        <DialogTitle className="mb-4 font-display text-lg font-extrabold">{companyName}</DialogTitle>
        <nav aria-label={messages.nav.mainNavigation} className="flex flex-1 flex-col gap-1">
          <DialogClose asChild>
            <Link href="/courses" className={link}>
              {messages.nav.allCourses}
            </Link>
          </DialogClose>
          <Accordion type="multiple">
            {categories.map((cat) => (
              <AccordionItem key={cat.id} value={cat.id}>
                <AccordionTrigger className="px-2 text-sm">{cat.name}</AccordionTrigger>
                <AccordionContent className="pl-4">
                  <DialogClose asChild>
                    <Link href={`/courses?category=${cat.slug}`} className={link}>
                      {messages.nav.allCourses} · {cat.name}
                    </Link>
                  </DialogClose>
                  {cat.children.map((ch) => (
                    <DialogClose asChild key={ch.id}>
                      <Link href={`/courses?category=${ch.slug}`} className={link}>
                        {ch.name}
                      </Link>
                    </DialogClose>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <DialogClose asChild>
            <Link href="/compare" className={link}>
              {messages.nav.compare}
            </Link>
          </DialogClose>
          <DialogClose asChild>
            <Link href="/contact" className={link}>
              {messages.contact.title}
            </Link>
          </DialogClose>
          <div className="mt-4 border-t border-border pt-4">
            {user ? (
              <>
                {[
                  ['/my-courses', messages.nav.myCourses],
                  ['/wishlist', messages.nav.wishlist],
                  ['/profile', messages.nav.profile],
                ].map(([href, label]) => (
                  <DialogClose asChild key={href}>
                    <Link href={href} className={link}>
                      {label}
                    </Link>
                  </DialogClose>
                ))}
                <button type="button" className={`${link} w-full text-left`} onClick={() => signOut({ callbackUrl: '/' })}>
                  {messages.nav.logout}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <ButtonLink href="/login" variant="outline" onClick={close}>
                  {messages.nav.login}
                </ButtonLink>
                <ButtonLink href="/signup" onClick={close}>
                  {messages.nav.signup}
                </ButtonLink>
              </div>
            )}
          </div>
        </nav>
      </DialogContent>
    </Dialog>
  )
}
