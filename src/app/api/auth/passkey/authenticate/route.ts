import { NextRequest, NextResponse } from 'next/server'
import { verifyPasskeyAuthentication } from '@/lib/passkey'
import { signIn } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential, userId, credentialId } = body

    if (!credential || !userId || !credentialId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const result = await verifyPasskeyAuthentication(
      userId,
      credential,
      credentialId
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Get user email
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true }
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
        userId,
        action: 'LOGIN',
        details: { email: user.email, credentialId, method: 'passkey' }
      }
    })

    // Sign in using credentials - passkey was already verified so skip password check
    const signInResult = await signIn('credentials', {
      email: user.email,
      password: '', // Dummy password, ignored when passkeyVerified is true
      redirect: false,
      passkeyVerified: true // Custom flag to indicate passkey authentication
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
    console.error('Passkey authentication error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
