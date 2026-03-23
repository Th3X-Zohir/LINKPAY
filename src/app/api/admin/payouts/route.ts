import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional()
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

    const [payouts, total] = await Promise.all([
      db.payout.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, bkashNumber: true }
          },
          transaction: {
            select: { id: true, amount: true }
          }
        }
      }),
      db.payout.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: payouts,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    })
  } catch (error) {
    console.error('Admin payouts error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payouts' } },
      { status: 500 }
    )
  }
}

const updatePayoutSchema = z.object({
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']),
  bkashTxnId: z.string().optional(),
  failureReason: z.string().optional()
})

export async function PATCH(request: NextRequest) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const payoutId = searchParams.get('id')

    if (!payoutId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Payout ID required' } },
        { status: 400 }
      )
    }

    const parsed = updatePayoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const updateData: any = {
      status: parsed.data.status
    }

    if (parsed.data.status === 'COMPLETED') {
      updateData.processedAt = new Date()
    }
    if (parsed.data.bkashTxnId) {
      updateData.bkashTxnId = parsed.data.bkashTxnId
    }
    if (parsed.data.failureReason) {
      updateData.failureReason = parsed.data.failureReason
    }

    const payout = await db.payout.update({
      where: { id: payoutId },
      data: updateData,
      include: {
        user: { select: { email: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: payout,
      message: 'Payout updated successfully'
    })
  } catch (error) {
    console.error('Admin update payout error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update payout' } },
      { status: 500 }
    )
  }
}