import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { initiateBkashPayout } from '@/lib/api/bkash'
import { createAuditLog } from '@/lib/audit'

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
        user: { select: { bkashNumber: true, bankAccount: true, bankName: true } },
        transactions: { select: { id: true, netAmount: true } }
      }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payout not found' } },
        { status: 404 }
      )
    }

    if (payout.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Only approved payouts can be executed' } },
        { status: 400 }
      )
    }

    // Update status to PROCESSING
    await db.payout.update({
      where: { id },
      data: { status: 'PROCESSING' }
    })

    await createAuditLog({
      action: 'PAYOUT_INITIATED',
      userId: payout.userId,
      metadata: {
        payoutId: id,
        amount: payout.amount,
        method: payout.method,
        initiatedBy: adminUserId
      },
      ipAddress: clientIp,
    })

    // Execute based on method
    if (payout.method === 'BKASH') {
      const reference = `LP-${id.slice(-8).toUpperCase()}`
      const result = await initiateBkashPayout(
        payout.amount / 100, // Convert from poisha to taka
        payout.user.bkashNumber!,
        reference
      )

      if (result.status === 'success' && result.trxId) {
        // Update payout with bKash transaction ID
        await db.payout.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            bkashTxnId: result.trxId,
            processedAt: new Date()
          }
        })

        // Update transaction payout statuses
        await db.transaction.updateMany({
          where: { payoutId: id },
          data: { payoutStatus: 'COMPLETED' }
        })

        await createAuditLog({
          action: 'PAYOUT_COMPLETED',
          userId: payout.userId,
          metadata: {
            payoutId: id,
            bkashTxnId: result.trxId,
            amount: payout.amount
          },
          ipAddress: clientIp,
        })

        return NextResponse.json({
          success: true,
          data: {
            payoutId: id,
            status: 'COMPLETED',
            bkashTxnId: result.trxId
          },
          message: 'bKash payout executed successfully'
        })
      } else {
        // Payout failed
        const errorMsg = result.error || 'bKash payout initiation failed'

        await db.payout.update({
          where: { id },
          data: {
            status: 'FAILED',
            failureMsg: errorMsg
          }
        })

        await createAuditLog({
          action: 'PAYOUT_FAILED',
          userId: payout.userId,
          metadata: {
            payoutId: id,
            reason: errorMsg,
            amount: payout.amount
          },
          ipAddress: clientIp,
        })

        return NextResponse.json(
          {
            success: false,
            error: { code: 'PAYOUT_FAILED', message: errorMsg },
            data: {
              payoutId: id,
              status: 'FAILED',
              failureReason: errorMsg
            }
          },
          { status: 400 }
        )
      }
    } else {
      // Bank transfer - mark as failed for now (bank integration not implemented)
      await db.payout.update({
        where: { id },
        data: {
          status: 'FAILED',
          failureMsg: 'Bank transfer not yet implemented'
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_IMPLEMENTED', message: 'Bank transfer not yet implemented' }
        },
        { status: 501 }
      )
    }
  } catch (error) {
    console.error('Payout execution error:', error)

    // Try to update payout status to FAILED
    try {
      const { id } = await params
      await db.payout.update({
        where: { id },
        data: {
          status: 'FAILED',
          failureMsg: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    } catch {
      // Ignore update error
    }

    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to execute payout' } },
      { status: 500 }
    )
  }
}
