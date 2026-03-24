import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySSLCommerzWebhook } from '@/lib/api/sslcommerz'
import { createAuditLog, AuditAction } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const postData: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      postData[key] = value as string
    }

    // Verify and parse the webhook
    const verification = verifySSLCommerzWebhook(postData)
    
    if (!verification || !verification.valid) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const { status, tranId, amount } = verification

    // Find payment link by transaction ID (stored as tran_id)
    // The tran_id in SSLCommerz is the session ID we generated
    const paymentLink = await db.paymentLink.findFirst({
      where: {
        shareUrl: tranId.split('_')[0] // First part is shareUrl
      },
      include: {
        user: true
      }
    })

    if (!paymentLink) {
      // Try to find by aamarPayId if SSLCommerz tran_id was stored differently
      const paymentLinkByAamarPay = await db.paymentLink.findFirst({
        where: {
          aamarPayId: tranId
        },
        include: {
          user: true
        }
      })

      if (!paymentLinkByAamarPay) {
        return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
      }

      // Handle based on status
      if (status === 'VALIDATED' || status === '成功') {
        // Payment successful
        await db.transaction.updateMany({
          where: {
            paymentLinkId: paymentLinkByAamarPay.id,
            status: 'PENDING'
          },
          data: {
            status: 'SUCCESS',
            aamarPayTxnId: tranId
          }
        })

        await db.paymentLink.update({
          where: { id: paymentLinkByAamarPay.id },
          data: { status: 'PAID' }
        })

        await createAuditLog({
          action: AuditAction.PAYMENT_RECEIVED,
          userId: paymentLinkByAamarPay.userId,
          metadata: {
            paymentLinkId: paymentLinkByAamarPay.id,
            amount,
            gateway: 'sslcommerz',
            tranId
          }
        })

        return NextResponse.json({ status: 'success' })
      } else if (status === 'CANCELLED') {
        await createAuditLog({
          action: AuditAction.PAYMENT_CANCELLED,
          userId: paymentLinkByAamarPay.userId,
          metadata: {
            paymentLinkId: paymentLinkByAamarPay.id,
            gateway: 'sslcommerz',
            tranId
          }
        })
        return NextResponse.json({ status: 'cancelled' })
      } else if (status === 'FAILED') {
        await createAuditLog({
          action: AuditAction.PAYMENT_FAILED,
          userId: paymentLinkByAamarPay.userId,
          metadata: {
            paymentLinkId: paymentLinkByAamarPay.id,
            gateway: 'sslcommerz',
            tranId
          }
        })
        return NextResponse.json({ status: 'failed' })
      }
    }

    // Handle based on status for main payment link
    if (status === 'VALIDATED' || status === '成功') {
      // Payment successful
      const transaction = await db.transaction.updateMany({
        where: {
          paymentLinkId: paymentLink.id,
          status: 'PENDING'
        },
        data: {
          status: 'SUCCESS',
          aamarPayTxnId: tranId
        }
      })

      await db.paymentLink.update({
        where: { id: paymentLink.id },
        data: { status: 'PAID' }
      })

      await createAuditLog({
        action: AuditAction.PAYMENT_RECEIVED,
        userId: paymentLink.userId,
        metadata: {
          paymentLinkId: paymentLink.id,
          amount,
          gateway: 'sslcommerz',
          tranId
        }
      })
    } else if (status === 'CANCELLED') {
      await createAuditLog({
        action: AuditAction.PAYMENT_CANCELLED,
        userId: paymentLink.userId,
        metadata: {
          paymentLinkId: paymentLink.id,
          gateway: 'sslcommerz',
          tranId
        }
      })
    } else if (status === 'FAILED') {
      await createAuditLog({
        action: AuditAction.PAYMENT_FAILED,
        userId: paymentLink.userId,
        metadata: {
          paymentLinkId: paymentLink.id,
          gateway: 'sslcommerz',
          tranId
        }
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('SSLCommerz webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
