import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { auth, handlers, signIn } = NextAuth(authConfig)

export { auth, handlers, signIn }

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
