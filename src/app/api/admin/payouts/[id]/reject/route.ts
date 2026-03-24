import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters')
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  try {
    const { id } = await params
    const session = await auth()
    const adminUserId = session?.user?.id

    if (!adminUserId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin session required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = rejectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const payout = await db.payout.findUnique({
      where: { id },
      include: { transactions: true }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payout not found' } },
        { status: 404 }
      )
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Only pending payouts can be rejected' } },
        { status: 400 }
      )
    }

    // Unlink transactions to make them available for new payout
    const transactionIds = payout.transactions.map(t => t.id)

    await Promise.all([
      db.payout.update({
        where: { id },
        data: {
          status: 'REJECTED',
          failureMsg: parsed.data.reason,
          approvedBy: adminUserId,
          approvedAt: new Date()
        }
      }),
      db.transaction.updateMany({
        where: { id: { in: transactionIds } },
        data: { payoutStatus: 'PENDING', payoutId: null }
      }),
      createAuditLog({
        action: 'PAYOUT_REJECTED',
        userId: payout.userId,
        metadata: {
          payoutId: id,
          amount: payout.amount,
          method: payout.method,
          rejectedBy: adminUserId,
          reason: parsed.data.reason,
          transactionCount: transactionIds.length
        },
        ipAddress: clientIp,
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Payout rejected successfully',
      data: {
        transactionsUnlinked: transactionIds.length
      }
    })
  } catch (error) {
    console.error('Payout rejection error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to reject payout' } },
      { status: 500 }
    )
  }
}
