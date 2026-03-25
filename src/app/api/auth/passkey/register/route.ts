import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyPasskeyRegistration } from '@/lib/passkey'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { credential, challenge, name } = body

    if (!credential || !challenge) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const result = await verifyPasskeyRegistration(
      session.user.id,
      credential,
      challenge,
      name
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PASSKEY_REGISTERED',
        details: {
          passkeyId: result.passkey.id,
          deviceType: result.passkey.deviceType
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Passkey registered successfully'
    })
  } catch (error) {
    console.error('Passkey registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
