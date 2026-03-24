import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { registerSchema } from '@/lib/validators'
import { createVerificationToken } from '@/lib/verification'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, phone } = parsed.data

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null
      }
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATED',
        details: { email: user.email }
      }
    })

    // Create email verification token
    const token = await createVerificationToken(email, 'EMAIL_VERIFICATION')
    const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your LinkPay BD account',
        html: `
          <h1>Welcome to LinkPay BD!</h1>
          <p>Hi ${name || 'there'},</p>
          <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email Address</a>
          <p>Or copy this link: ${verifyUrl}</p>
          <p>This link expires in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 14px;">If you didn't create an account with LinkPay BD, please ignore this email.</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
        message: 'Account created. Please check your email to verify your account.'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
