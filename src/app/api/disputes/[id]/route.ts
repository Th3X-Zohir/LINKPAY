import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED']).optional(),
  adminNotes: z.string().max(1000).optional(),
  resolution: z.string().max(1000).optional()
})

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Check ownership (user owns the dispute or is admin)
    if (dispute.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dispute
    })
  } catch (error) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dispute' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const dispute = await db.dispute.findUnique({
      where: { id }
    })

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = dispute.userId === session.user.id
    const isAdmin = session.user.isAdmin

    // Regular users can only update their own disputes with OPEN or UNDER_REVIEW status
    // and can only update the description
    if (!isAdmin) {
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
        return NextResponse.json(
          { success: false, error: 'Cannot update a resolved or closed dispute' },
          { status: 400 }
        )
      }
    }

    const body = await request.json()
    const parsed = updateDisputeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (parsed.data.status) {
      updateData.status = parsed.data.status

      // Set resolvedAt if resolving
      if (parsed.data.status === 'RESOLVED' || parsed.data.status === 'REJECTED') {
        updateData.resolvedAt = new Date()
      }
    }

    if (parsed.data.adminNotes && isAdmin) {
      updateData.adminNotes = parsed.data.adminNotes
    }

    if (parsed.data.resolution) {
      updateData.resolution = parsed.data.resolution
    }

    const updatedDispute = await db.dispute.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DISPUTE_UPDATED',
        details: { disputeId: id, changes: parsed.data }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedDispute,
      message: 'Dispute updated successfully'
    })
  } catch (error) {
    console.error('Error updating dispute:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update dispute' },
      { status: 500 }
    )
  }
}