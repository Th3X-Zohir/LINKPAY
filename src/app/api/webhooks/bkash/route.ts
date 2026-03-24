import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface WebhookPayload {
  trx_id: string
  payout_id?: string
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING'
  error_message?: string
  updated_at: string
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  try {
    const payload: WebhookPayload = await request.json()

    // Log the webhook event with IP
    console.log('bKash webhook received:', JSON.stringify(payload), 'from IP:', clientIp)

    // Find payout by bKash transaction ID
    const payout = await db.payout.findFirst({
      where: { bkashTxnId: payload.trx_id }
    })

    if (!payout) {
      // Try to find by payout_id if provided
      if (payload.payout_id) {
        const payoutById = await db.payout.findUnique({
          where: { id: payload.payout_id }
        })
        if (payoutById) {
          await processPayoutUpdate(payoutById.id, payload)
          return NextResponse.json({ received: true })
        }
      }

      // Store for later processing if not found
      await db.webhookEvent.create({
        data: {
          eventId: `bkash-${payload.trx_id}-${Date.now()}`,
          eventType: 'BKASH_PAYOUT_UPDATE',
          payload: JSON.parse(JSON.stringify(payload)),
          processed: false
        }
      })

      return NextResponse.json({ received: true, message: 'Payout not found, stored for processing' })
    }

    await processPayoutUpdate(payout.id, payload)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('bKash webhook error:', error)
    return NextResponse.json(
      { received: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function processPayoutUpdate(payoutId: string, payload: WebhookPayload) {
  const existingPayout = await db.payout.findUnique({
    where: { id: payoutId }
  })

  if (!existingPayout) return

  // Determine new status based on bKash status
  let newStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED' | undefined
  let failureMsg: string | undefined

  switch (payload.status) {
    case 'SUCCESS':
      newStatus = 'COMPLETED'
      break
    case 'FAILED':
      newStatus = 'FAILED'
      failureMsg = payload.error_message || 'bKash reported failure'
      break
    case 'PROCESSING':
      newStatus = 'PROCESSING'
      break
  }

  if (!newStatus) return

  // Update payout
  await db.payout.update({
    where: { id: payoutId },
    data: {
      status: newStatus,
      failureMsg: failureMsg,
      processedAt: new Date()
    }
  })

  // Update transaction statuses
  const transactionUpdate = newStatus === 'COMPLETED' ? 'COMPLETED' : newStatus === 'FAILED' ? 'PENDING' : 'PROCESSING'

  if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
    await db.transaction.updateMany({
      where: { payoutId: payoutId },
      data: { payoutStatus: transactionUpdate }
    })
  }

  // Create audit log
  await db.auditLog.create({
    data: {
      userId: existingPayout.userId,
      action: newStatus === 'COMPLETED' ? 'PAYOUT_COMPLETED' :
              newStatus === 'FAILED' ? 'PAYOUT_FAILED' : 'PAYOUT_INITIATED',
      details: {
        payoutId: payoutId,
        bkashTxnId: payload.trx_id,
        bkashStatus: payload.status,
        errorMessage: payload.error_message,
        updatedAt: payload.updated_at
      }
    }
  })

  // Mark webhook event as processed
  await db.webhookEvent.updateMany({
    where: {
      eventType: 'BKASH_PAYOUT_UPDATE',
      processed: false
    },
    data: { processed: true, processedAt: new Date() }
  })
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'bKash payout webhook handler',
    timestamp: new Date().toISOString()
  })
}
