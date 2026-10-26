'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { messages } from '@/lib/messages'

const KEY = 'compare_ids'
const EVENT = 'compare:change'
const MAX = 3

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX) : []
  } catch {
    return []
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* storage blocked: compare simply will not persist */
  }
  window.dispatchEvent(new Event(EVENT))
}

/** REQ-150: only course IDs live in localStorage; max 3. */
export function useCompare() {
  const [ids, setIds] = React.useState<string[]>([])

  React.useEffect(() => {
    const sync = () => setIds(read())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggle = React.useCallback((id: string) => {
    const current = read()
    if (current.includes(id)) {
      write(current.filter((x) => x !== id))
      return
    }
    if (current.length >= MAX) {
      toast.error(messages.compare.max)
      return
    }
    write([...current, id])
    toast.success(messages.compare.added)
  }, [])

  const remove = React.useCallback((id: string) => write(read().filter((x) => x !== id)), [])
  const clear = React.useCallback(() => write([]), [])

  return { ids, has: (id: string) => ids.includes(id), toggle, remove, clear }
}
