import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/users/[id]
 * Get single user details with related data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      include: {
        paymentLinks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            description: true,
            status: true,
            shareUrl: true,
            createdAt: true,
            _count: { select: { transactions: true } }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            platformFee: true,
            netAmount: true,
            status: true,
            aamarPayTxnId: true,
            createdAt: true
          }
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
            processedAt: true
          }
        },
        _count: {
          select: {
            paymentLinks: true,
            transactions: true,
            payouts: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Calculate user volume
    const volumeStats = await db.transaction.aggregate({
      where: { userId: id, status: 'SUCCESS' },
      _sum: { amount: true, platformFee: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        totalVolume: volumeStats._sum.amount || 0,
        totalPlatformFees: volumeStats._sum.platformFee || 0
      }
    })
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user' } },
      { status: 500 }
    )
  }
}

const updateUserSchema = z.object({
  plan: z.enum(['FREE', 'PREMIUM']).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  bkashNumber: z.string().optional(),
  bkashVerified: z.boolean().optional(),
  bankVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional()
})

/**
 * PATCH /api/admin/users/[id]
 * Update user (admin actions)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  try {
    const { id } = await params
    const body = await request.json()
    const session = await auth()
    const adminUserId = session?.user?.id

    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Get current user state for audit
    const currentUser = await db.user.findUnique({
      where: { id },
      select: {
        name: true,
        phone: true,
        plan: true,
        isAdmin: true,
        bkashVerified: true,
        bankVerified: true
      }
    })

    const updateData: Record<string, unknown> = {}

    if (parsed.data.plan) updateData.plan = parsed.data.plan
    if (parsed.data.name) updateData.name = parsed.data.name
    if (parsed.data.phone) updateData.phone = parsed.data.phone
    if (parsed.data.bkashNumber) updateData.bkashNumber = parsed.data.bkashNumber
    if (parsed.data.bkashVerified !== undefined) updateData.bkashVerified = parsed.data.bkashVerified
    if (parsed.data.bankVerified !== undefined) updateData.bankVerified = parsed.data.bankVerified
    if (parsed.data.isAdmin !== undefined) updateData.isAdmin = parsed.data.isAdmin

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        plan: true,
        bkashVerified: true,
        bankVerified: true,
        isAdmin: true
      }
    })

    // Log admin user update
    await createAuditLog({
      action: 'USER_UPDATED',
      userId: id,
      metadata: {
        adminAction: true,
        updatedBy: adminUserId,
        changes: {
          name: currentUser?.name !== user.name ? { from: currentUser?.name, to: user.name } : undefined,
          phone: currentUser?.phone !== user.phone ? { from: currentUser?.phone, to: user.phone } : undefined,
          plan: currentUser?.plan !== user.plan ? { from: currentUser?.plan, to: user.plan } : undefined,
          isAdmin: currentUser?.isAdmin !== user.isAdmin ? { from: currentUser?.isAdmin, to: user.isAdmin } : undefined,
          bkashVerified: currentUser?.bkashVerified !== user.bkashVerified ? { from: currentUser?.bkashVerified, to: user.bkashVerified } : undefined,
          bankVerified: currentUser?.bankVerified !== user.bankVerified ? { from: currentUser?.bankVerified, to: user.bankVerified } : undefined,
        }
      },
      ipAddress: clientIp,
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
