import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'

/**
 * GET /api/admin/analytics/dashboard
 * Platform-wide statistics for admin dashboard
 */
export async function GET() {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    // Core metrics
    const [
      totalUsers,
      totalTransactions,
      successfulTransactions,
      pendingPayoutsCount,
      totalPaymentLinks
    ] = await Promise.all([
      db.user.count(),
      db.transaction.count(),
      db.transaction.count({ where: { status: 'SUCCESS' } }),
      db.payout.count({ where: { status: 'PENDING' } }),
      db.paymentLink.count()
    ])

    // Calculate volume and revenue
    const volumeStats = await db.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true, netAmount: true, platformFee: true }
    })

    const totalVolume = volumeStats._sum.amount || 0
    const totalRevenue = volumeStats._sum.platformFee || 0

    // Pending payouts amount
    const pendingPayoutsAmount = await db.payout.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true }
    })

    // Last 7 days signup count
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSignups = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })

    // Last 7 days transaction count
    const recentTransactions = await db.transaction.count({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: sevenDaysAgo }
      }
    })

    // Calculate trends (comparing to previous 7 days)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const previousWeekSignups = await db.user.count({
      where: {
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
      }
    })

    const previousWeekTransactions = await db.transaction.count({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
      }
    })

    // Calculate trend percentages
    const signupTrend = previousWeekSignups > 0
      ? Math.round(((recentSignups - previousWeekSignups) / previousWeekSignups) * 100)
      : recentSignups > 0 ? 100 : 0

    const transactionTrend = previousWeekTransactions > 0
      ? Math.round(((recentTransactions - previousWeekTransactions) / previousWeekTransactions) * 100)
      : recentTransactions > 0 ? 100 : 0

    // User plan distribution
    const planDistribution = await db.user.groupBy({
      by: ['plan'],
      _count: { plan: true }
    })

    // Transaction status distribution
    const transactionStatusDistribution = await db.transaction.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    // Payout status distribution
    const payoutStatusDistribution = await db.payout.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    // Recent transactions (last 10)
    const recentTransactionsList = await db.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        paymentLink: { select: { description: true } }
      }
    })

    // Recent users (last 10)
    const recentUsers = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalTransactions,
          successfulTransactions,
          failedTransactions: totalTransactions - successfulTransactions,
          pendingPayoutsCount,
          totalPayouts: totalPaymentLinks
        },
        volume: {
          totalVolume,
          totalNetAmount: volumeStats._sum.netAmount || 0,
          platformRevenue: totalRevenue,
          pendingPayoutsAmount: pendingPayoutsAmount._sum.amount || 0
        },
        trends: {
          recentSignups,
          signupTrend,
          recentTransactions,
          transactionTrend
        },
        distribution: {
          plans: planDistribution.reduce((acc, item) => {
            acc[item.plan] = item._count.plan
            return acc
          }, {} as Record<string, number>),
          transactionStatuses: transactionStatusDistribution.reduce((acc, item) => {
            acc[item.status] = item._count.status
            return acc
          }, {} as Record<string, number>),
          payoutStatuses: payoutStatusDistribution.reduce((acc, item) => {
            acc[item.status] = item._count.status
            return acc
          }, {} as Record<string, number>)
        },
        recentTransactions: recentTransactionsList.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          status: tx.status,
          user: tx.user,
          paymentLink: tx.paymentLink
        })),
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          createdAt: user.createdAt.toISOString(),
          _count: user._count
        }))
      }
    })
  } catch (error) {
    console.error('Admin dashboard analytics error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard analytics' } },
      { status: 500 }
    )
  }
}
