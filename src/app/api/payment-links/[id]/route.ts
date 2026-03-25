import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Transaction limits based on KYC level (stored in poisha)
const TRANSACTION_LIMITS = {
  UNVERIFIED: 100000, // ৳1,000
  BASIC: 1000000,     // ৳10,000
  FULL: 10000000      // ৳1,00,000
} as const

type KycLevel = 'UNVERIFIED' | 'BASIC' | 'FULL'

const updatePaymentLinkSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  amount: z.number().int().min(100).max(10000000).optional(),
  serviceCategory: z.enum(['WEB_DEVELOPMENT', 'GRAPHIC_DESIGN', 'DATA_ENTRY', 'CONSULTING', 'COPYWRITING', 'VIDEO_EDITING', 'OTHER']).optional(),
  expiresAt: z.string().datetime().optional().nullable()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const paymentLink = await db.paymentLink.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment link not found' } },
        { status: 404 }
      )
    }

    // Check ownership
    if (paymentLink.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: paymentLink
    })
  } catch (error) {
    console.error('Error fetching payment link:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payment link' } },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const existing = await db.paymentLink.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment link not found' } },
        { status: 404 }
      )
    }

    // Check ownership
    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Can't update paid links
    if (existing.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Cannot update paid payment links' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updatePaymentLinkSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // If amount is being changed, verify KYC level limits
    if (parsed.data.amount !== undefined && parsed.data.amount !== existing.amount) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { kycLevel: true }
      })
      
      if (user) {
        const kycLevel = (user.kycLevel || 'UNVERIFIED') as KycLevel
        const limit = TRANSACTION_LIMITS[kycLevel] || TRANSACTION_LIMITS.UNVERIFIED
        
        if (parsed.data.amount > limit) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'LIMIT_EXCEEDED',
              message: `Transaction amount exceeds your limit of ৳${(limit / 100).toLocaleString('en-BD')} for ${kycLevel === 'UNVERIFIED' ? 'unverified' : kycLevel === 'BASIC' ? 'basic' : 'full'} KYC level. Please upgrade your account or complete KYC verification.`
            }
          }, { status: 400 })
        }
      }
    }

    const paymentLink = await db.paymentLink.update({
      where: { id },
      data: {
        description: parsed.data.description,
        amount: parsed.data.amount,
        serviceCategory: parsed.data.serviceCategory,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined
      }
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PAYMENT_LINK_UPDATED',
        details: { changes: parsed.data, entityId: id }
      }
    })

    return NextResponse.json({
      success: true,
      data: paymentLink,
      message: 'Payment link updated successfully'
    })
  } catch (error) {
    console.error('Error updating payment link:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update payment link' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const existing = await db.paymentLink.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment link not found' } },
        { status: 404 }
      )
    }

    // Check ownership
    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Can't delete paid links - instead cancel them
    if (existing.status === 'PAID') {
      await db.paymentLink.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PAYMENT_LINK_CANCELLED',
          details: { entityId: id }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Paid payment links cannot be deleted but have been cancelled'
      })
    }

    await db.paymentLink.delete({
      where: { id }
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PAYMENT_LINK_DELETED',
        details: { shareUrl: existing.shareUrl, entityId: id }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment link deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment link:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete payment link' } },
      { status: 500 }
    )
  }
}