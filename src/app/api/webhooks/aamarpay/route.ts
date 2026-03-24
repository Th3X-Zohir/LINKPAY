import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/api/aamarPay'
import { sendPaymentReceivedEmail } from '@/lib/email'
import { createAuditLog } from '@/lib/audit'

interface AamarPayWebhookPayload {
  status: string
  payment_id: string
  amount?: string
  customer_id?: string
  merchant_id?: string
  offer_plan?: string
  offer_amount?: string
  card_number?: string
  bank_status?: string
  risk_title?: string
  risk_level?: string
  trx_id?: string
  updated_at?: string
  created_at?: string
  event_id?: string
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  try {
    const payload: AamarPayWebhookPayload = await request.json()
    const signature = request.headers.get('x-aamarpay-signature')

    if (!verifyWebhookSignature(payload, signature)) {
      console.log('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const eventId = payload.event_id || payload.payment_id

    // Check for duplicate webhook delivery
    const existingEvent = await db.webhookEvent.findUnique({
      where: { eventId }
    })

    if (existingEvent?.processed) {
      return NextResponse.json({ message: 'Event already processed' })
    }

    // Create webhook event record first (not yet processed)
    await db.webhookEvent.create({
      data: {
        eventId,
        eventType: 'PAYMENT_STATUS',
        payload: JSON.parse(JSON.stringify(payload)),
        processed: false,
        processedAt: null
      }
    })

    try {
      if (payload.status === 'success' || payload.status === 'Successful') {
        const paymentLink = await db.paymentLink.findFirst({
          where: { aamarPayId: payload.payment_id },
          include: { user: true }
        })

        if (!paymentLink) {
          console.log('Payment link not found for:', payload.payment_id)
          // Don't mark as processed - allow retry
          return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
        }

        const amount = Math.round(parseFloat(payload.amount || '0') * 100)
        const platformFee = Math.round(amount * 0.0075)
        const gatewayFee = Math.round(amount * 0.0255)
        const netAmount = amount - platformFee - gatewayFee

        // Atomic transaction: update PaymentLink and create Transaction together
        const transaction = await db.$transaction(async (tx) => {
          await tx.paymentLink.update({
            where: { id: paymentLink.id },
            data: {
              status: 'PAID',
              paidAt: new Date()
            }
          })

          return tx.transaction.create({
            data: {
              paymentLinkId: paymentLink.id,
              userId: paymentLink.userId,
              amount,
              platformFee,
              gatewayFee,
              netAmount,
              status: 'SUCCESS',
              aamarPayTxnId: payload.trx_id || payload.payment_id,
              aamarPayFees: JSON.stringify({
                platform: platformFee,
                gateway: gatewayFee
              })
            }
          })
        })

        // Log successful payment
        await createAuditLog({
          action: 'TRANSACTION_SUCCESS',
          userId: paymentLink.userId,
          metadata: {
            transactionId: transaction.id,
            paymentLinkId: paymentLink.id,
            amount,
            netAmount,
            platformFee,
            gatewayFee,
            aamarPayTxnId: payload.trx_id || payload.payment_id,
            gateway: 'aamarpay'
          },
          ipAddress: clientIp,
        })

        // Send email notification
        await sendPaymentReceivedEmail({
          to: paymentLink.user.email,
          freelancerName: paymentLink.user.name || 'Freelancer',
          clientName: paymentLink.customerName || undefined,
          amount,
          description: paymentLink.description,
          netAmount,
          platformFee
        }).catch((err) => {
          console.error('Failed to send payment email:', err)
        })
      } else if (payload.status === 'failed' || payload.status === 'Failed' || payload.status === 'fail') {
        // Handle failed payment
        const paymentLink = await db.paymentLink.findFirst({
          where: { aamarPayId: payload.payment_id },
          include: { user: true }
        })

        if (paymentLink) {
          // Update payment link status to CANCELLED
          await db.paymentLink.update({
            where: { id: paymentLink.id },
            data: { status: 'CANCELLED' }
          })

          await createAuditLog({
            action: 'TRANSACTION_FAILED',
            userId: paymentLink.userId,
            metadata: {
              paymentLinkId: paymentLink.id,
              aamarPayId: payload.payment_id,
              reason: payload.bank_status || 'Payment failed',
              gateway: 'aamarpay'
            },
            ipAddress: clientIp,
          })
        }
      }

      // Mark webhook event as processed after successful completion
      await db.webhookEvent.update({
        where: { eventId },
        data: {
          processed: true,
          processedAt: new Date()
        }
      })

      return NextResponse.json({ message: 'Webhook processed successfully' })
    } catch (error) {
      // Mark event as not processed on error - allows retry
      await db.webhookEvent.update({
        where: { eventId },
        data: {
          processed: false,
          processedAt: null
        }
      }).catch(() => { /* ignore update error */ })

      throw error // Re-throw to trigger outer catch block
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
