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

    // Sign in the user using credentials provider
    // OTP was verified, so we pass otpVerified flag to skip password check
    const signInResult = await signIn('credentials', {
      email,
      password: '', // Required field but ignored since otpVerified is true
      redirect: false,
      otpVerified: true
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
