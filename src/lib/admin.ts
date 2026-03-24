import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function isAdmin() {
  const session = await auth()
  if (!session?.user?.email) return false

  // Check if user is admin - in production, check against admin emails from env or DB
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(session.user.email)
}

export async function requireAdmin() {
  const isUserAdmin = await isAdmin()
  if (!isUserAdmin) {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    )
  }
  return null
}