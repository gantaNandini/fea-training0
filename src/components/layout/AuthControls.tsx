'use client'

import * as React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { BookOpen, Heart, LogOut, User as UserIcon } from 'lucide-react'
import { useUserState } from '@/hooks/useUserState'
import { ButtonLink } from '@/components/ui/button'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { Skeleton } from '@/components/ui/skeleton'
import { messages } from '@/lib/messages'

/** Log in / Sign up, or the avatar menu — identity comes from /api/me/state only (REQ-032). */
export function AuthControls() {
  const { user, loaded } = useUserState()

  if (!loaded) return <Skeleton className="h-11 w-28" />

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <ButtonLink href="/login" variant="ghost">
          {messages.nav.login}
        </ButtonLink>
        <ButtonLink href="/signup">{messages.nav.signup}</ButtonLink>
      </div>
    )
  }

  const item =
    'flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-muted'
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={messages.nav.accountMenu}
          data-testid="account-menu"
          className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border"
        >
          <span className="relative block h-9 w-9 overflow-hidden rounded-full">
            <PlaceholderArt
              src={user.image ?? 'placeholder:avatar'}
              alt={user.name ?? messages.nav.profile}
              label={user.name ?? 'U'}
              fill
              sizes="36px"
              className="object-cover"
            />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <p className="truncate px-3 py-2 text-sm font-semibold">{user.name}</p>
        <PopoverClose asChild>
          <Link href="/my-courses" className={item}>
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {messages.nav.myCourses}
          </Link>
        </PopoverClose>
        <PopoverClose asChild>
          <Link href="/wishlist" className={item}>
            <Heart className="h-4 w-4" aria-hidden="true" />
            {messages.nav.wishlist}
          </Link>
        </PopoverClose>
        <PopoverClose asChild>
          <Link href="/profile" className={item}>
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            {messages.nav.profile}
          </Link>
        </PopoverClose>
        <button type="button" className={item} onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {messages.nav.logout}
        </button>
      </PopoverContent>
    </Popover>
  )
}
