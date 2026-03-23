import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).optional(),
  search: z.string().optional()
})

export async function GET(request: NextRequest) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))
    const skip = (params.page - 1) * params.limit

    const where: any = {}
    if (params.status) {
      where.status = params.status
    }
    if (params.search) {
      where.OR = [
        { aamarPayTxnId: { contains: params.search, mode: 'insensitive' } },
        { paymentLink: { description: { contains: params.search, mode: 'insensitive' } } }
      ]
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          paymentLink: {
            select: { id: true, description: true, shareUrl: true }
          }
        }
      }),
      db.transaction.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    })
  } catch (error) {
    console.error('Admin transactions error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch transactions' } },
      { status: 500 }
    )
  }
}