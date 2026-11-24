import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import type { Provider } from 'next-auth/providers'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/utils/validation'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/net/ip'
import { getUserForLogin } from '@/lib/data/users'
import { authConfig } from './auth.config'

class RateLimitedError extends CredentialsSignin {
  code = 'rate_limited'
}

// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10)

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials, request) {
      const parsed = loginSchema.safeParse(credentials)
      if (!parsed.success) return null
      const { email, password } = parsed.data

      // REQ-126: the same limiter protects the Auth.js authorize() path.
      const ip = getClientIp(request.headers)
      const limit = await checkAuthRateLimit(ip, 'login', email)
      if (!limit.allowed) throw new RateLimitedError()

      const user = await getUserForLogin(email)
      const hash = user?.passwordHash ?? DUMMY_HASH
      const valid = await bcrypt.compare(password, hash)
      if (!user || !user.passwordHash || !valid) return null

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        sessionVersion: user.sessionVersion,
      }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers,
})
