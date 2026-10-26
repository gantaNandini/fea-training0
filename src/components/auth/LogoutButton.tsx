'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { messages } from '@/lib/messages'

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>
      {messages.nav.logout}
    </Button>
  )
}
