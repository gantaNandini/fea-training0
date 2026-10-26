import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe Auth.js config (REQ-120): no Prisma, no bcrypt. Imported by middleware.
 * Providers and the adapter are added in `auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role ?? 'STUDENT'
        token.sv = user.sessionVersion ?? 1
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? ''
        session.user.role = (token.role as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | undefined) ?? 'STUDENT'
        session.user.sv = (token.sv as number | undefined) ?? 1
      }
      return session
    },
  },
} satisfies NextAuthConfig
