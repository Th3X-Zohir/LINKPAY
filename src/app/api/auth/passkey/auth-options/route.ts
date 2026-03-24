import { NextRequest, NextResponse } from 'next/server'
import { generatePasskeyAuthenticationOptions } from '@/lib/passkey'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await generatePasskeyAuthenticationOptions(email)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.options,
      userId: result.userId
    })
  } catch (error) {
    console.error('Passkey auth options error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate options' },
      { status: 500 }
    )
  }
}
