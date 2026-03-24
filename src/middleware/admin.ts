import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Admin middleware function to protect /admin/* routes
 * Checks if the user is authenticated and has admin privileges
 */
export async function adminMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const session = await auth()

  // Check if user is authenticated
  if (!session?.user?.email) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    return null
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  const isAdmin = adminEmails.includes(session.user.email)

  if (!isAdmin && request.nextUrl.pathname.startsWith('/admin')) {
    // Redirect non-admins to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return null
}

/**
 * Get current admin status from session
 */
export async function isAdminUser(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.email) return false

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(session.user.email)
}
