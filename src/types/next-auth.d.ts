import type { DefaultSession } from 'next-auth'

type AppRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'

declare module 'next-auth' {
  interface User {
    role?: AppRole
    sessionVersion?: number
  }
  interface Session {
    user: {
      id: string
      role: AppRole
      sv: number
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: AppRole
    sv?: number
  }
}
