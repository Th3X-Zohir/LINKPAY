import { NextRequest, NextResponse } from 'next/server'
import { verifyOtpToken } from '@/lib/otp'
import { db } from '@/lib/db'
import {signIn} from '@/lib/auth'
import { z } from 'zod'

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = verifyOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const { email, otp } = parsed.data

    // Verify OTP
    const result = await verifyOtpToken(email, otp, 'LOGIN')

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_OTP',
        details: { method: 'OTP', email }
      }
    })

    // Sign in the user using credentials provider with a dummy password
    // Since OTP verified the user, we can create a session
    // Note: This is a simplified approach. In production, you might want to
    // use a separate OTP-only authentication flow

    const signInResult = await signIn('credentials', {
      email,
      password: '__otp_verified__', // Dummy password, user authenticated via OTP
      redirect: false
    })

    if (signInResult?.error) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
