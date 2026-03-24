import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkBkashPayoutStatus } from '@/lib/api/bkash'

interface WebhookPayload {
  trx_id: string
  payout_id?: string
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING'
  error_message?: string
  updated_at: string
}

// Whitelist bKash IP ranges (production IPs should be configured via env)
const BKASH_TRUSTED_IPS = process.env.BKASH_TRUSTED_IPS?.split(',') || [
  '172.16.10.0/24', // bKash sandbox/production IPs - should be updated for production
]

function isTrustedIp(ip: string): boolean {
  // In production, verify against actual bKash IPs
  // For now, allow if BKASH_TRUSTED_IPS is not set (development mode)
  if (process.env.NODE_ENV === 'production' && BKASH_TRUSTED_IPS.length > 0) {
    return BKASH_TRUSTED_IPS.some(trusted =>
      ip === trusted || ip.startsWith(trusted.replace('/24', ''))
    )
  }
  // In development, allow all but log warning
  console.warn('bKash webhook called from IP:', ip, '- Consider configuring BKASH_TRUSTED_IPS in production')
  return true
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Verify request is from trusted source
  if (!isTrustedIp(clientIp)) {
    console.error('bKash webhook rejected - untrusted IP:', clientIp)
    return NextResponse.json(
      { error: 'Unauthorized - untrusted source' },
      { status: 403 }
    )
  }

  try {
    const payload: WebhookPayload = await request.json()

    // Log the webhook event with IP
    console.log('bKash webhook received:', JSON.stringify(payload), 'from IP:', clientIp)

    // CRITICAL: Verify the transaction actually exists in bKash before processing
    // This prevents fake webhook calls from marking fake payouts as completed
    const bkashStatus = await checkBkashPayoutStatus(payload.trx_id)
    if (bkashStatus === 'UNKNOWN' || bkashStatus === 'FAILED') {
      console.warn('bKash webhook - transaction not found in bKash system:', payload.trx_id)
      // Still store for manual investigation but don't mark as completed
      await db.webhookEvent.create({
        data: {
          eventId: `bkash-verify-fail-${payload.trx_id}-${Date.now()}`,
          eventType: 'BKASH_PAYOUT_UPDATE',
          payload: JSON.parse(JSON.stringify(payload)),
          processed: false
        }
      })
      return NextResponse.json(
        { error: 'Transaction not verified with bKash' },
        { status: 400 }
      )
    }

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
