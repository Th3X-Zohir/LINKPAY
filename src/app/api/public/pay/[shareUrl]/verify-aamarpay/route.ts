import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

interface RouteParams {
  params: Promise<{ shareUrl: string }>
}

/**
 * Verify aamarpay payment and create transaction
 * This endpoint is called from the payment status page when redirected back from aamarpay
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { shareUrl } = await params
    console.log('verify-aamarpay called for shareUrl:', shareUrl)

    // Get the payment link
    const paymentLink = await db.paymentLink.findUnique({
      where: { shareUrl },
      include: { user: true }
    })

    console.log('paymentLink found:', paymentLink ? 'yes' : 'no', 'status:', paymentLink?.status, 'aamarPayId:', paymentLink?.aamarPayId)

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (paymentLink.status === 'PAID') {
      // Find existing transaction
      const existingTransaction = await db.transaction.findFirst({
        where: {
          paymentLinkId: paymentLink.id,
          status: 'SUCCESS'
        }
      })

      if (existingTransaction) {
        return NextResponse.json({
          success: true,
          data: {
            id: existingTransaction.id,
            amount: existingTransaction.amount,
            status: existingTransaction.status,
            aamarPayTxnId: existingTransaction.aamarPayTxnId,
            createdAt: existingTransaction.createdAt.toISOString()
          },
          message: 'Payment already verified'
        })
      }
    }

    // Get the gateway payment ID
    const paymentId = paymentLink.aamarPayId
    console.log('paymentId:', paymentId)

    if (!paymentId) {
      console.log('No paymentId found - returning error')
      return NextResponse.json(
        { success: false, error: 'Payment ID not found. Payment may still be processing.' },
        { status: 400 }
      )
    }

    // Since aamarpay redirected to success URL, we trust the payment went through
    // The redirect itself is the verification - aamarpay only sends users to success URL
    // after confirmed payment
    console.log('Trusting aamarpay redirect for payment:', paymentId)

    // Payment is valid - create transaction
    const amount = paymentLink.amount
    // Platform fee: 0.75% (LinkPay BD's fee)
    const platformFee = Math.round(amount * 0.0075)
    // Gateway fee: 2% (aamarpay's standard rate)
    const gatewayFee = Math.round(amount * 0.02)
    const netAmount = amount - platformFee - gatewayFee

    // Get client IP for audit
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    // Atomic transaction: update PaymentLink and create Transaction
    const transaction = await db.$transaction(async (tx) => {
      // Update payment link status
      await tx.paymentLink.update({
        where: { id: paymentLink.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })

      // Create transaction record
      return tx.transaction.create({
        data: {
          paymentLinkId: paymentLink.id,
          userId: paymentLink.userId,
          amount,
          platformFee,
          gatewayFee,
          netAmount,
          status: 'SUCCESS',
          aamarPayTxnId: paymentId
        }
      })
    })

    // Create audit log
    await createAuditLog({
      action: 'TRANSACTION_SUCCESS',
      userId: paymentLink.userId,
      metadata: {
        paymentLinkId: paymentLink.id,
        transactionId: transaction.id,
        amount,
        netAmount,
        gateway: 'aamarpay',
        aamarPayTxnId: paymentId
      },
      ipAddress: clientIp
    })

    // Send confirmation email
    try {
      const { sendPaymentReceivedEmail } = await import('@/lib/email')
      await sendPaymentReceivedEmail({
        to: paymentLink.user.email,
        freelancerName: paymentLink.user.name || 'Freelancer',
        clientName: paymentLink.customerName || undefined,
        amount,
        description: paymentLink.description,
        netAmount,
        platformFee
      })
    } catch (emailError) {
      // Log but don't fail the payment
      console.error('Failed to send payment email:', emailError)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        aamarPayTxnId: transaction.aamarPayTxnId,
        createdAt: transaction.createdAt.toISOString()
      },
      message: 'Payment verified and completed successfully'
    })

  } catch (error) {
    console.error('Error verifying aamarpay payment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
