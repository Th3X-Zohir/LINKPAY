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

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        paymentLink: {
          select: {
            id: true,
            description: true,
            amount: true,
            customerName: true,
            customerEmail: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      )
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('Transaction fetch error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch transaction' } },
      { status: 500 }
    )
  }
}