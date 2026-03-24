import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createDisputeSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  reason: z.enum(['CLIENT_NOT_PAID', 'SERVICE_NOT_DELIVERED', 'OVERCHARGED', 'DUPLICATE_CHARGE', 'UNAUTHORIZED_CHARGE', 'OTHER']),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  evidenceUrls: z.array(z.string().url()).optional().default([])
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const disputes = await db.dispute.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: disputes
    })
  } catch (error) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = createDisputeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { transactionId, reason, description, evidenceUrls } = parsed.data

    // Verify the transaction exists and belongs to the user
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: { paymentLink: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if there's already an open dispute for this transaction
    const existingDispute = await db.dispute.findFirst({
      where: {
        transactionId,
        userId: session.user.id,
        status: { in: ['OPEN', 'UNDER_REVIEW'] }
      }
    })

    if (existingDispute) {
      return NextResponse.json(
        { success: false, error: 'An active dispute already exists for this transaction' },
        { status: 400 }
      )
    }

    // Create the dispute
    const dispute = await db.dispute.create({
      data: {
        transactionId,
        userId: session.user.id,
        reason,
        description,
        evidenceUrls,
        amount: transaction.amount,
        status: 'OPEN'
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DISPUTE_CREATED',
        details: { disputeId: dispute.id, transactionId, reason }
      }
    })

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Dispute created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating dispute:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create dispute' },
      { status: 500 }
    )
  }
}