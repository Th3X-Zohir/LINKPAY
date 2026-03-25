import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifySSLCommerzPayment } from '@/lib/api/sslcommerz'

interface ApiResponse {
  success: boolean
  error?: string
  plan?: string
  message?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id')

    if (!subscriptionId) {
      return NextResponse.json({ success: false, error: 'Missing subscription_id' }, { status: 400 })
    }

    // Find the pending subscription
    const pendingSubscription = await db.pendingSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    })

    if (!pendingSubscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 })
    }

    if (pendingSubscription.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (pendingSubscription.status === 'COMPLETED') {
      return NextResponse.json({ success: true, plan: pendingSubscription.plan })
    }

    // Verify with SSLCommerz
    const sslCommerzTranId = pendingSubscription.aamarPayId
    if (sslCommerzTranId) {
      const verification = await verifySSLCommerzPayment(sslCommerzTranId)

      if (verification && verification.status === 'VALID') {
        // Update subscription to completed
        await db.pendingSubscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'COMPLETED',
            activatedAt: new Date()
          }
        })

        // Update user to premium
        await db.user.update({
          where: { id: pendingSubscription.userId },
          data: { plan: 'PREMIUM' }
        })

        // Create audit log
        await db.auditLog.create({
          data: {
            userId: pendingSubscription.userId,
            action: 'USER_UPDATED',
            details: {
              action: 'PREMIUM_ACTIVATED',
              subscriptionId: pendingSubscription.id,
              sslCommerzTranId: sslCommerzTranId,
              amount: pendingSubscription.amount
            }
          }
        })

        return NextResponse.json({
          success: true,
          plan: 'PREMIUM',
          message: 'Premium subscription activated'
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Payment not verified yet'
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
