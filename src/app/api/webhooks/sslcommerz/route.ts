import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySSLSignature } from '@/lib/api/sslcommerz'
import { sendPaymentReceivedEmail } from '@/lib/email'
import { createAuditLog } from '@/lib/audit'

interface SSLCommerzWebhookPayload {
  status: string
  tran_id: string
  val_id?: string
  amount?: string
  store_amount?: string
  bank_tran_id?: string
  card_type?: string
  card_no?: string
  risk_level?: string
  risk_title?: string
  currency?: string
  sessionkey?: string
  stored_card_name?: string
  store_id?: string
  error?: string
  signature?: string
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  try {
    const payload: SSLCommerzWebhookPayload = await request.json()

    // SSLCommerz sends status as a single value: VALID, FAILED, CANCELLED
    const { status, tran_id, val_id, amount, bank_tran_id, card_type, signature: bodySignature } = payload

    // Verify signature - SSLCommerz sends signature in POST body as 'signature' field
    // Also check header for backward compatibility
    const signature = request.headers.get('ssl-signature') || bodySignature
    if (!signature || !verifySSLSignature(payload as unknown as Record<string, string>, signature)) {
      console.log('Invalid or missing SSLCommerz webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Use upsert pattern for race condition safety
    // This ensures only one webhook processing can succeed for a given eventId
    const webhookEvent = await db.webhookEvent.upsert({
      where: { eventId: tran_id },
      create: {
        eventId: tran_id,
        eventType: 'SSL_COMMERZ_PAYMENT_STATUS',
        payload: JSON.parse(JSON.stringify(payload)),
        processed: false,
        processedAt: null
      },
      update: {
        payload: JSON.parse(JSON.stringify(payload)),
        processed: false,
        processedAt: null
      }
    })

    // If event was already processed, skip
    if (webhookEvent.processed) {
      return NextResponse.json({ message: 'Event already processed' })
    }

    try {
      // Handle different statuses
      if (status === 'VALID') {
        // Successful payment
        // Look up by aamarPayId which stores the SSLCommerz tran_id
        const paymentLink = await db.paymentLink.findFirst({
          where: {
            aamarPayId: tran_id
          },
          include: { user: true }
        })

        if (!paymentLink) {
          console.log('Payment link not found for tran_id:', tran_id)
          // Don't mark as processed - allow retry
          return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
        }

        // Amount in BDT, convert to poisha (multiply by 100)
        const webhookAmount = Math.round(parseFloat(amount || '0') * 100)
        
        // Verify webhook amount matches payment link amount (prevent manipulation)
        if (webhookAmount !== paymentLink.amount) {
          console.error('SSLCommerz webhook amount mismatch:', {
            webhookAmount,
            paymentLinkAmount: paymentLink.amount,
            tran_id
          })
          // Don't mark as processed - amount mismatch needs investigation
          return NextResponse.json({ error: 'Amount mismatch - investigation required' }, { status: 400 })
        }

        const amountInPoisha = webhookAmount
        // Platform fee: 0.75% (LinkPay BD's fee)
        const platformFee = Math.round(amountInPoisha * 0.0075)
        // Gateway fee: 2.5% (SSLCommerz's standard rate)
        // Note: SSLCommerz charges 2.5% flat (no additional VAT at this rate)
        const gatewayFee = Math.round(amountInPoisha * 0.025)
        const netAmount = amountInPoisha - platformFee - gatewayFee

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
              amount: amountInPoisha,
              platformFee,
              gatewayFee,
              netAmount,
              status: 'SUCCESS',
              aamarPayTxnId: bank_tran_id || tran_id,
              aamarPayFees: JSON.stringify({
                platform: platformFee,
                gateway: gatewayFee,
                sslcommerzValId: val_id
              })
            }
          })
        })

        // Create audit log entry
        await createAuditLog({
          action: 'TRANSACTION_SUCCESS',
          userId: paymentLink.userId,
          metadata: {
            transactionId: transaction.id,
            paymentLinkId: paymentLink.id,
            amount: amountInPoisha,
            netAmount,
            platformFee,
            gatewayFee,
            sslcommerzTranId: tran_id,
            sslcommerzValId: val_id,
            cardType: card_type,
            gateway: 'sslcommerz'
          },
          ipAddress: clientIp
        })

        // Send email notification
        await sendPaymentReceivedEmail({
          to: paymentLink.user.email,
          freelancerName: paymentLink.user.name || 'Freelancer',
          clientName: paymentLink.customerName || undefined,
          amount: amountInPoisha,
          description: paymentLink.description,
          netAmount,
          platformFee
        }).catch((err) => {
          console.error('Failed to send payment email:', err)
        })
      } else if (status === 'CANCELLED') {
        // Handle cancelled payment - look up by aamarPayId which stores the SSLCommerz tran_id
        const paymentLink = await db.paymentLink.findFirst({
          where: {
            aamarPayId: tran_id
          },
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
              sslcommerzTranId: tran_id,
              reason: 'Payment cancelled by user',
              gateway: 'sslcommerz'
            },
            ipAddress: clientIp
          })
        }
      } else if (status === 'FAILED') {
        // Handle failed payment - look up by aamarPayId which stores the SSLCommerz tran_id
        const paymentLink = await db.paymentLink.findFirst({
          where: {
            aamarPayId: tran_id
          },
          include: { user: true }
        })

        if (paymentLink) {
          // Update payment link status to CANCELLED (payment was attempted but failed)
          await db.paymentLink.update({
            where: { id: paymentLink.id },
            data: { status: 'CANCELLED' }
          })

          await createAuditLog({
            action: 'TRANSACTION_FAILED',
            userId: paymentLink.userId,
            metadata: {
              paymentLinkId: paymentLink.id,
              sslcommerzTranId: tran_id,
              reason: payload.error || 'Payment failed',
              gateway: 'sslcommerz'
            },
            ipAddress: clientIp
          })
        }
      }

      // Mark webhook event as processed after successful completion
      await db.webhookEvent.update({
        where: { eventId: tran_id },
        data: {
          processed: true,
          processedAt: new Date()
        }
      })

      return NextResponse.json({ message: 'Webhook processed successfully' })
    } catch (error) {
      // Mark event as not processed on error - allows retry
      await db.webhookEvent.update({
        where: { eventId: tran_id },
        data: {
          processed: false,
          processedAt: null
        }
      }).catch(() => { /* ignore update error */ })

      throw error // Re-throw to trigger outer catch block
    }
  } catch (error) {
    console.error('SSLCommerz webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}