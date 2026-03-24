import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { z } from 'zod'

const approveSchema = z.object({
  notes: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  try {
    const { id } = await params
    const session = await auth()
    const adminUserId = session?.user?.id

    if (!adminUserId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin session required' } },
        { status: 401 }
      )
    }

    const payout = await db.payout.findUnique({
      where: { id },
      include: {
        user: { select: { bkashNumber: true, bankAccount: true, bankName: true } }
      }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payout not found' } },
        { status: 404 }
      )
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Only pending payouts can be approved' } },
        { status: 400 }
      )
    }

    // Validate payout method details exist
    if (payout.method === 'BKASH' && !payout.user.bkashNumber) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DETAILS', message: 'User bKash number not found' } },
        { status: 400 }
      )
    }

    if (payout.method === 'BANK' && (!payout.user.bankAccount || !payout.user.bankName)) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DETAILS', message: 'User bank details not found' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = approveSchema.safeParse(body)

    // Update payout status to APPROVED
    const [updatedPayout] = await Promise.all([
      db.payout.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: adminUserId,
          approvedAt: new Date()
        }
      }),
      createAuditLog({
        action: 'PAYOUT_APPROVED',
        userId: payout.userId,
        metadata: {
          payoutId: id,
          amount: payout.amount,
          method: payout.method,
          approvedBy: adminUserId,
          notes: parsed.success ? parsed.data.notes : null
        },
        ipAddress: clientIp,
      })
    ])

    return NextResponse.json({
      success: true,
      data: updatedPayout,
      message: 'Payout approved successfully'
    })
  } catch (error) {
    console.error('Payout approval error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to approve payout' } },
      { status: 500 }
    )
  }
}
