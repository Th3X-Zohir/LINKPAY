import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export async function GET(request: NextRequest) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))
    const skip = (params.page - 1) * params.limit

    const where: Record<string, unknown> = {}

    if (params.action) {
      where.action = params.action
    }

    if (params.userId) {
      where.userId = params.userId
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(params.startDate)
      }
      if (params.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(params.endDate)
      }
    }

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      db.auditLog.count({ where })
    ])

    // Get unique action types for filter dropdown
    const actionTypes = await db.auditLog.groupBy({
      by: ['action'],
      _count: { action: true }
    })

    return NextResponse.json({
      success: true,
      data: auditLogs,
      actionTypes: actionTypes.map(a => ({ action: a.action, count: a._count.action })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    })
  } catch (error) {
    console.error('Admin audit logs error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit logs' } },
      { status: 500 }
    )
  }
}
