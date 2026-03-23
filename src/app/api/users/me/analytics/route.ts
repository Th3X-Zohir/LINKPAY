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

    const userId = session.user.id

    // Get all successful transactions
    const transactions = await db.transaction.findMany({
      where: { userId, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' }
    })

    const paymentLinksCount = await db.paymentLink.count({
      where: { userId }
    })

    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalEarnings = transactions.reduce((sum, t) => sum + t.netAmount, 0)
    const totalFees = transactions.reduce((sum, t) => sum + t.platformFee + t.gatewayFee, 0)

    // Calculate daily earnings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = transactions.filter(t => new Date(t.createdAt) >= thirtyDaysAgo)
    const dailyEarnings: Record<string, number> = {}
    const dailyTransactions: Record<string, number> = {}

    recentTransactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0]
      dailyEarnings[date] = (dailyEarnings[date] || 0) + t.netAmount
      dailyTransactions[date] = (dailyTransactions[date] || 0) + 1
    })

    const sortedDates = Object.keys(dailyEarnings).sort()
    const earningsChartData = sortedDates.map(date => ({
      date,
      earnings: dailyEarnings[date]
    }))

    const transactionChartData = sortedDates.map(date => ({
      date,
      count: dailyTransactions[date] || 0
    }))

    // Fee breakdown
    const feeBreakdown = {
      platformFee: transactions.reduce((sum, t) => sum + t.platformFee, 0),
      gatewayFee: transactions.reduce((sum, t) => sum + t.gatewayFee, 0)
    }

    // Calculate success rate
    const totalPaymentLinks = await db.paymentLink.count({
      where: { userId }
    })
    const successRate = totalPaymentLinks > 0
      ? Math.round((transactions.length / totalPaymentLinks) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEarnings,
          totalVolume,
          totalFees,
          transactionCount: transactions.length,
          paymentLinksCount,
          successRate
        },
        dailyEarnings: earningsChartData,
        dailyTransactions: transactionChartData,
        topTransactions: transactions.slice(0, 10).map(t => ({
          id: t.id,
          amount: t.amount,
          netAmount: t.netAmount,
          platformFee: t.platformFee,
          gatewayFee: t.gatewayFee,
          createdAt: t.createdAt.toISOString(),
          description: ''
        })),
        feeBreakdown
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } },
      { status: 500 }
    )
  }
}