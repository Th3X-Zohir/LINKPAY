import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate available balance from successful transactions not yet paid out
    const availableTransactions = await db.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      },
      _sum: {
        netAmount: true
      }
    })

    const available = availableTransactions._sum.netAmount || 0

    // Get pending payouts (money that user requested but not yet received)
    const pendingPayouts = await db.payout.aggregate({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      _sum: {
        amount: true
      }
    })

    const pending = pendingPayouts._sum.amount || 0

    // Get lifetime earnings (all successful transactions)
    const lifetimeEarnings = await db.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: 'SUCCESS'
      },
      _sum: {
        netAmount: true
      }
    })

    const total = lifetimeEarnings._sum.netAmount || 0

    // Count of available transactions
    const availableCount = await db.transaction.count({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        available,
        pending,
        total,
        pendingTransactionCount: availableCount
      }
    })
  } catch (error) {
    console.error('Error fetching user balance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
