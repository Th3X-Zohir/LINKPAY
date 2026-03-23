import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'

export async function GET() {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const [
      totalUsers,
      totalPaymentLinks,
      totalTransactions,
      successfulTransactions,
      pendingPayouts,
      totalPayouts
    ] = await Promise.all([
      db.user.count(),
      db.paymentLink.count(),
      db.transaction.count(),
      db.transaction.count({ where: { status: 'SUCCESS' } }),
      db.payout.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      db.payout.count()
    ])

    // Calculate total volume
    const volumeStats = await db.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true, netAmount: true, platformFee: true }
    })

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentUsers = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })

    // Transactions by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const transactionsLast30Days = await db.transaction.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { amount: true, createdAt: true }
    })

    // Group by day
    const dailyVolume: Record<string, number> = {}
    transactionsLast30Days.forEach(tx => {
      const date = tx.createdAt.toISOString().split('T')[0]
      dailyVolume[date] = (dailyVolume[date] || 0) + tx.amount
    })

    // Top users by volume
    const topUsers = await db.transaction.groupBy({
      by: ['userId'],
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    })

    // Get user details for top users
    const topUserIds = topUsers.map(u => u.userId)
    const topUserDetails = await db.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, email: true }
    })

    const topUsersWithDetails = topUsers.map(tu => ({
      userId: tu.userId,
      totalVolume: tu._sum.amount || 0,
      user: topUserDetails.find(u => u.id === tu.userId)
    }))

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalPaymentLinks,
          totalTransactions,
          successfulTransactions,
          failedTransactions: totalTransactions - successfulTransactions,
          pendingPayouts,
          totalPayouts,
          recentUsers
        },
        volume: {
          totalVolume: volumeStats._sum.amount || 0,
          totalNetAmount: volumeStats._sum.netAmount || 0,
          totalPlatformRevenue: volumeStats._sum.platformFee || 0
        },
        dailyVolume,
        topUsers: topUsersWithDetails
      }
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } },
      { status: 500 }
    )
  }
}