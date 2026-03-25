import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { db } from './db'
import bcrypt from 'bcryptjs'
import { checkAccountLockout } from './account-lockout'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  passkeyVerified: z.boolean().optional(),
  otpVerified: z.boolean().optional()
})

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    newUser: '/register'
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password, passkeyVerified, otpVerified } = parsed.data

        const user = await db.user.findUnique({
          where: { email }
        })

        if (!user) return null

        // Check if account is locked BEFORE any authentication
        const lockoutStatus = await checkAccountLockout(user.id)
        if (lockoutStatus.isLocked) {
          console.warn(`Login blocked for locked account: ${email}`)
          return null
        }

        // If passkey or OTP was verified, skip password check
        if (passkeyVerified || otpVerified) {
          return {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }

        // Normal password check
        if (!user.passwordHash) return null

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  }
}
