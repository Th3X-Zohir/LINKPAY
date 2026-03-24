import { NextRequest, NextResponse } from 'next/server'
import { createOtp } from '@/lib/otp'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists, an OTP has been sent'
      })
    }

    // Create OTP
    const result = await createOtp(email, 'LOGIN')

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 }
      )
    }

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: 'Your LinkPay BD Login Code',
      html: `
        <h1>Login Verification Code</h1>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center;">
          ${result.otp}
        </div>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email'
    })
  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
