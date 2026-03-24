import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/verification'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const result = await verifyToken(token, 'EMAIL_VERIFICATION')

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Update user's email verification status
    await db.user.update({
      where: { email: result.email },
      data: { emailVerified: new Date() }
    })

    // Log the verification
    const user = await db.user.findUnique({ where: { email: result.email } })
    if (user) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'EMAIL_VERIFIED',
          details: { email: result.email }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
