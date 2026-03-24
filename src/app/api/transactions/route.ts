import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { TransactionStatus } from '@prisma/client'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))
    const skip = (params.page - 1) * params.limit

    const where: { userId: string; status?: TransactionStatus } = { userId: session.user.id }
    if (params.status) {
      where.status = params.status as TransactionStatus
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          paymentLink: {
            select: {
              id: true,
              description: true,
              shareUrl: true,
              amount: true
            }
          }
        }
      }),
      db.transaction.count({ where })
    ])

    // Calculate summary stats
    const stats = await db.transaction.aggregate({
      where: { userId: session.user.id, status: 'SUCCESS' },
      _sum: { amount: true, netAmount: true, platformFee: true, gatewayFee: true }
    })

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      },
      summary: {
        totalVolume: stats._sum.amount || 0,
        totalNetAmount: stats._sum.netAmount || 0,
        totalPlatformFee: stats._sum.platformFee || 0,
        totalGatewayFee: stats._sum.gatewayFee || 0
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch transactions' } },
      { status: 500 }
    )
  }
}