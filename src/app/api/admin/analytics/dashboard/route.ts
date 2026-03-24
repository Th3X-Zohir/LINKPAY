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

    // Recent transactions (last 10)
    const recentTransactions = await db.transaction.findMany({
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
        totalUsers,
        totalPaymentLinks,
        totalTransactions,
        successfulTransactions,
        pendingPayouts: pendingPayoutsCount,
        totalVolume,
        totalRevenue,
        recentTransactions: recentTransactions.map(tx => ({
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
