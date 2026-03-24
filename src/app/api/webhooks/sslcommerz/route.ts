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
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  try {
    const payload: SSLCommerzWebhookPayload = await request.json()

    // SSLCommerz sends status as a single value: VALID, FAILED, CANCELLED
    const { status, tran_id, val_id, amount, bank_tran_id, card_type } = payload

    // Verify signature if provided
    const signature = request.headers.get('ssl-signature')
    if (signature && !verifySSLSignature(payload as unknown as Record<string, string>, signature)) {
      console.log('Invalid SSLCommerz webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Duplicate detection using WebhookEvent table (tran_id as eventId)
    const existingEvent = await db.webhookEvent.findUnique({
      where: { eventId: tran_id }
    })

    if (existingEvent?.processed) {
      return NextResponse.json({ message: 'Event already processed' })
    }

    // Mark event as processed
    await db.webhookEvent.create({
      data: {
        eventId: tran_id,
        eventType: 'SSL_COMMERZ_PAYMENT_STATUS',
        payload: JSON.parse(JSON.stringify(payload)),
        processed: true,
        processedAt: new Date()
      }
    })

    // Handle different statuses
    if (status === 'VALID') {
      // Successful payment
      const paymentLink = await db.paymentLink.findFirst({
        where: {
          OR: [
            { aamarPayId: tran_id },
            { shareUrl: tran_id }
          ]
        },
        include: { user: true }
      })

      if (!paymentLink) {
        console.log('Payment link not found for tran_id:', tran_id)
        return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
      }

      // Amount in BDT, convert to poisha (multiply by 100)
      const amountInPoisha = Math.round(parseFloat(amount || '0') * 100)
      const platformFee = Math.round(amountInPoisha * 0.0075) // 0.75% platform fee
      const gatewayFee = Math.round(amountInPoisha * 0.025) // ~2.5% gateway fee
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
          cardType: card_type
        },
        ipAddress: clientIp
      })

      await db.auditLog.create({
        data: {
          userId: paymentLink.userId,
          action: 'TRANSACTION_SUCCESS',
          details: {
            paymentLinkId: paymentLink.id,
            transactionId: transaction.id,
            amount: amountInPoisha,
            netAmount
          }
        }
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

      return NextResponse.json({ message: 'Webhook processed successfully' })
    } else if (status === 'CANCELLED') {
      // Handle cancelled payment
      const paymentLink = await db.paymentLink.findFirst({
        where: {
          OR: [
            { aamarPayId: tran_id },
            { shareUrl: tran_id }
          ]
        },
        include: { user: true }
      })

      if (paymentLink) {
        await db.auditLog.create({
          data: {
            userId: paymentLink.userId,
            action: 'TRANSACTION_FAILED',
            details: {
              paymentLinkId: paymentLink.id,
              sslcommerzTranId: tran_id,
              reason: 'Payment cancelled by user'
            }
          }
        })
      }

      return NextResponse.json({ message: 'Webhook processed successfully' })
    } else if (status === 'FAILED') {
      // Handle failed payment
      const paymentLink = await db.paymentLink.findFirst({
        where: {
          OR: [
            { aamarPayId: tran_id },
            { shareUrl: tran_id }
          ]
        },
        include: { user: true }
      })

      if (paymentLink) {
        await db.auditLog.create({
          data: {
            userId: paymentLink.userId,
            action: 'TRANSACTION_FAILED',
            details: {
              paymentLinkId: paymentLink.id,
              sslcommerzTranId: tran_id,
              reason: payload.error || 'Payment failed'
            }
          }
        })
      }

      return NextResponse.json({ message: 'Webhook processed successfully' })
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('SSLCommerz webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}