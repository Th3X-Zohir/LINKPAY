import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/validators'
import { checkRateLimit, RateLimits, createRateLimitHeaders } from '@/lib/rate-limit'
import { createAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Apply rate limiting
  const rateLimitKey = `login:${clientIp}`
  if (!checkRateLimit(rateLimitKey, RateLimits.LOGIN_ATTEMPT.limit, RateLimits.LOGIN_ATTEMPT.windowMs)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitKey, RateLimits.LOGIN_ATTEMPT.limit),
      }
    )
  }

  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const userAgent = request.headers.get('user-agent') || undefined

    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user || !user.passwordHash) {
      // Log failed attempt (user not found, but we still track IP)
      await createAuditLog({
        action: 'LOGIN',
        metadata: { reason: 'User not found', email, success: false },
        ipAddress: clientIp,
        userAgent,
      })

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      await createAuditLog({
        action: 'LOGIN',
        userId: user.id,
        metadata: { reason: 'Invalid password', success: false },
        ipAddress: clientIp,
        userAgent,
      })

      return NextResponse.json(
        { error: 'Invalid email or password' },
        {
          status: 401,
          headers: createRateLimitHeaders(rateLimitKey, RateLimits.LOGIN_ATTEMPT.limit),
        }
      )
    }

    // Log successful login
    await createAuditLog({
      action: 'LOGIN',
      userId: user.id,
      metadata: { email: user.email, success: true },
      ipAddress: clientIp,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
