import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const isAdmin = adminEmails.includes(session.user.email)

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false })
  }
}