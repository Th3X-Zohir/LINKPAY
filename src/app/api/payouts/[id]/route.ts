import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please login' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const payout = await db.payout.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            bkashNumber: true,
            bankAccount: true,
            bankName: true
          }
        }
      }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payout not found' } },
        { status: 404 }
      )
    }

    if (payout.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: payout })
  } catch (error) {
    console.error('Payout fetch error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch payout' } },
      { status: 500 }
    )
  }
}