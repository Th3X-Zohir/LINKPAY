import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  plan: z.enum(['FREE', 'PREMIUM']).optional()
})

export async function GET(request: NextRequest) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))
    const skip = (params.page - 1) * params.limit

    const where: any = {}
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } }
      ]
    }
    if (params.plan) {
      where.plan = params.plan
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          plan: true,
          bkashNumber: true,
          createdAt: true,
          _count: {
            select: {
              paymentLinks: true,
              transactions: true
            }
          }
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: users.map(u => ({
        ...u,
        paymentLinksCount: u._count.paymentLinks,
        transactionsCount: u._count.transactions
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } },
      { status: 500 }
    )
  }
}

const updateUserSchema = z.object({
  plan: z.enum(['FREE', 'PREMIUM']).optional(),
  bkashNumber: z.string().optional(),
  isVerified: z.boolean().optional()
})

export async function PATCH(request: NextRequest) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'User ID required' } },
        { status: 400 }
      )
    }

    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } },
      { status: 500 }
    )
  }
}