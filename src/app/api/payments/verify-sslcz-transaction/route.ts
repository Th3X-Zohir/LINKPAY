import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

    // If tran_id is provided, try to find payment by it first
    if (tran_id) {
      const paymentLinkByTranId = await db.paymentLink.findFirst({
        where: { aamarPayId: tran_id },
        include: { user: true }
      })

      if (paymentLinkByTranId) {
        // Check for existing transaction
        const existingTransaction = await db.transaction.findFirst({
          where: {
            paymentLinkId: paymentLinkByTranId.id,
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

        // Create transaction for this payment link
        const amount = paymentLinkByTranId.amount
        const platformFee = Math.round(amount * 0.0075)
        const gatewayFee = Math.round(amount * 0.025)
        const netAmount = amount - platformFee - gatewayFee

        const transaction = await db.$transaction(async (tx) => {
          await tx.paymentLink.update({
            where: { id: paymentLinkByTranId.id },
            data: {
              status: 'PAID',
              paidAt: new Date()
            }
          })

          return tx.transaction.create({
            data: {
              paymentLinkId: paymentLinkByTranId.id,
              userId: paymentLinkByTranId.userId,
              amount,
              platformFee,
              gatewayFee,
              netAmount,
              status: 'SUCCESS',
              aamarPayTxnId: tran_id,
              aamarPayFees: JSON.stringify({
                platform: platformFee,
                gateway: gatewayFee,
                sslcommerzValId: val_id
              })
            }
          })
        })

        await createAuditLog({
          action: 'TRANSACTION_SUCCESS',
          userId: paymentLinkByTranId.userId,
          metadata: {
            transactionId: transaction.id,
            paymentLinkId: paymentLinkByTranId.id,
            amount,
            netAmount,
            gateway: 'sslcommerz',
            gatewayTranId: tran_id
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

    // If shareUrl is provided, check by shareUrl
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

        // If payment link has aamarPayId (payment was initiated), create transaction
        if (paymentLink.aamarPayId) {
          const amount = paymentLink.amount
          const platformFee = Math.round(amount * 0.0075)
          const gatewayFee = Math.round(amount * 0.025)
          const netAmount = amount - platformFee - gatewayFee

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
