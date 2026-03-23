import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requestPayoutSchema } from '@/lib/validators'
import { initiateBkashPayout } from '@/lib/api/bkash'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payouts = await db.payout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    const successfulPayouts = payouts.filter(p => p.status === 'COMPLETED')
    const totalPayout = successfulPayouts.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        payouts,
        summary: {
          totalPayout,
          pendingPayout: payouts
            .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
            .reduce((sum, p) => sum + p.amount, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = requestPayoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { amount, method } = parsed.data

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const availableEarnings = await db.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      },
      _sum: { netAmount: true }
    })

    const pending = availableEarnings._sum.netAmount || 0

    if (amount > pending) {
      return NextResponse.json(
        { error: `Insufficient earnings. Available: ৳${(pending / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    if (method === 'BKASH') {
      if (!user.bkashNumber) {
        return NextResponse.json(
          { error: 'Please add your bKash number first' },
          { status: 400 }
        )
      }

      const reference = `LP-${Date.now().toString(36)}`
      const payoutResult = await initiateBkashPayout(amount / 100, user.bkashNumber, reference)

      if (payoutResult.status !== 'success') {
        return NextResponse.json(
          { error: payoutResult.error || 'Failed to initiate bKash payout' },
          { status: 500 }
        )
      }

      const payout = await db.payout.create({
        data: {
          userId: session.user.id,
          amount,
          method: 'BKASH',
          status: 'PROCESSING',
          bkashTxnId: payoutResult.trxId
        }
      })

      await db.transaction.updateMany({
        where: {
          userId: session.user.id,
          status: 'SUCCESS',
          payoutStatus: 'PENDING'
        },
        data: {
          payoutStatus: 'PROCESSING',
          payoutId: payout.id
        }
      })

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PAYOUT_INITIATED',
          details: { payoutId: payout.id, amount, method: 'BKASH' }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: payout.id,
          status: payout.status,
          trxId: payoutResult.trxId,
          message: 'Payout initiated successfully'
        }
      })
    }

    return NextResponse.json(
      { error: 'Bank transfer not yet implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 })
  }
}
