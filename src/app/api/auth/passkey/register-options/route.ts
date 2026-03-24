import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generatePasskeyRegistrationOptions } from '@/lib/passkey'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await generatePasskeyRegistrationOptions(
      session.user.id,
      session.user.email || ''
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Store the challenge in a temporary location for verification
    // In production, store in Redis with TTL

    return NextResponse.json({
      success: true,
      data: result.options
    })
  } catch (error) {
    console.error('Passkey register options error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate options' },
      { status: 500 }
    )
  }
}
