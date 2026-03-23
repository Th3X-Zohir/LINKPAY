import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get all successful transactions that haven't been paid out
    const availableTransactions = await db.transaction.findMany({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      },
      select: {
        id: true,
        netAmount: true,
        createdAt: true
      }
    })

    const availableBalance = availableTransactions.reduce((sum, t) => sum + t.netAmount, 0)

    // Get pending payouts
    const pendingPayouts = await db.payout.aggregate({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      _sum: { amount: true }
    })

    // Get completed payouts
    const completedPayouts = await db.payout.aggregate({
      where: {
        userId: session.user.id,
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    })

    // Get lifetime earnings
    const lifetimeEarnings = await db.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: 'SUCCESS'
      },
      _sum: { netAmount: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        available: availableBalance,
        pendingPayout: pendingPayouts._sum.amount || 0,
        totalPaidOut: completedPayouts._sum.amount || 0,
        lifetimeEarnings: lifetimeEarnings._sum.netAmount || 0,
        pendingTransactionCount: availableTransactions.length
      }
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch balance' } },
      { status: 500 }
    )
  }
}