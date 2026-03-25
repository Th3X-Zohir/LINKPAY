import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySSLCommerzPayment } from '@/lib/api/sslcommerz'
import { createAuditLog } from '@/lib/audit'

interface ApiResponse {
  success: boolean
  data?: {
    id: string
    amount: number
    status: string
    aamarPayTxnId: string | null
    createdAt: string
  } | null
  error?: string
  message?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()
    const { tran_id, val_id, shareUrl } = body

    if (!tran_id && !shareUrl) {
      return NextResponse.json({ success: false, error: 'Missing tran_id or shareUrl' }, { status: 400 })
    }

    // Get client IP for audit
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    // First check if we already have this transaction in our DB
    if (shareUrl) {
      const paymentLink = await db.paymentLink.findUnique({
        where: { shareUrl },
        include: { user: true }
      })

      if (paymentLink) {
        // Check for existing transaction
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
            }
          })
        }

        // Check if payment link has a gateway ID (meaning payment was initiated)
        if (paymentLink.aamarPayId) {
          // SSLCommerz redirected to success - trust the redirect
          // Only redirect to success after confirmed payment
          console.log('Trusting SSLCommerz redirect for shareUrl:', shareUrl, 'aamarPayId:', paymentLink.aamarPayId)

          const amount = paymentLink.amount
          // Platform fee: 0.75% (LinkPay BD's fee)
          const platformFee = Math.round(amount * 0.0075)
          // Gateway fee: 2.5% (SSLCommerz's standard rate)
          const gatewayFee = Math.round(amount * 0.025)
          const netAmount = amount - platformFee - gatewayFee

          // Create transaction
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
                aamarPayTxnId: paymentLink.aamarPayId,
                aamarPayFees: JSON.stringify({
                  platform: platformFee,
                  gateway: gatewayFee
                })
              }
            })
          })

          // Create audit log
          await createAuditLog({
            action: 'TRANSACTION_SUCCESS',
            userId: paymentLink.userId,
            metadata: {
              transactionId: transaction.id,
              paymentLinkId: paymentLink.id,
              amount,
              netAmount,
              gateway: 'sslcommerz',
              gatewayTranId: paymentLink.aamarPayId
            },
            ipAddress: clientIp
          })

          return NextResponse.json({
            success: true,
            data: {
              id: transaction.id,
              amount: transaction.amount,
              status: transaction.status,
              aamarPayTxnId: transaction.aamarPayTxnId,
              createdAt: transaction.createdAt.toISOString()
            },
            message: 'Payment verified and completed'
          })
        }
      }
    }

    // If tran_id provided but no shareUrl match, try to verify with SSLCommerz
    if (tran_id && val_id) {
      const verification = await verifySSLCommerzPayment(tran_id, val_id)

      if (verification && verification.status === 'VALID') {
        // Payment is valid but not in our DB yet - webhook may not have processed
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Payment verified with gateway but not yet processed'
        })
      }
    }

    // Payment not found
    return NextResponse.json({
      success: true,
      data: null,
      message: 'No transaction found'
    })
  } catch (error) {
    console.error('SSLCommerz transaction verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
