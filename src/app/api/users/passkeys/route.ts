import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const passkeys = await db.passkey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        deviceType: true,
        createdAt: true,
        lastUsedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: passkeys.map(pk => ({
        id: pk.id,
        name: pk.name || 'Unnamed passkey',
        deviceType: pk.deviceType || 'unknown',
        createdAt: pk.createdAt,
        lastUsedAt: pk.lastUsedAt
      }))
    })
  } catch (error) {
    console.error('Get passkeys error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch passkeys' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const passkeyId = searchParams.get('id')

    if (!passkeyId) {
      return NextResponse.json(
        { success: false, error: 'Passkey ID is required' },
        { status: 400 }
      )
    }

    // Verify the passkey belongs to this user before deleting
    const passkey = await db.passkey.findFirst({
      where: {
        id: passkeyId,
        userId: session.user.id
      }
    })

    if (!passkey) {
      return NextResponse.json(
        { success: false, error: 'Passkey not found' },
        { status: 404 }
      )
    }

    // Check if user has at least one other authentication method
    // For security, we don't want to lock users out completely
    const userPasskeysCount = await db.passkey.count({
      where: { userId: session.user.id }
    })

    if (userPasskeysCount <= 1) {
      // User is about to delete their only passkey
      // Check if they have password set
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true }
      })

      if (!user?.passwordHash) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete your only passkey. Please set up an alternative login method first.' },
          { status: 400 }
        )
      }
    }

    await db.passkey.delete({
      where: { id: passkeyId }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PASSKEY_DELETED',
        details: {
          deletedPasskeyId: passkeyId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Passkey deleted successfully'
    })
  } catch (error) {
    console.error('Delete passkey error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete passkey' },
      { status: 500 }
    )
  }
}
