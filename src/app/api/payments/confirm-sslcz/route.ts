import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface ApiResponse {
  success: boolean
  error?: string
  plan?: string
  message?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription_id, tran_id, val_id, status } = body

    if (!subscription_id) {
      return NextResponse.json({ success: false, error: 'Missing subscription_id' }, { status: 400 })
    }

    // SSLCommerz only redirects to success URL when payment is VALID
    // So if we're here with status=VALID, we can trust the payment
    if (status !== 'VALID') {
      return NextResponse.json({ success: false, error: 'Invalid payment status' }, { status: 400 })
    }

    // Find the pending subscription
    const pendingSubscription = await db.pendingSubscription.findUnique({
      where: { id: subscription_id },
      include: { user: true }
    })

    if (!pendingSubscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 })
    }

    if (pendingSubscription.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (pendingSubscription.status === 'COMPLETED') {
      // Already completed, just return success
      return NextResponse.json({ success: true, plan: pendingSubscription.plan })
    }

    // Update subscription to completed
    await db.pendingSubscription.update({
      where: { id: subscription_id },
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
          action: 'PREMIUM_ACTIVATED_VIA_SSL COMMERZ_REDIRECT',
          subscriptionId: pendingSubscription.id,
          sslCommerzTranId: tran_id,
          sslCommerzValId: val_id,
          amount: pendingSubscription.amount
        }
      }
    })

    return NextResponse.json({
      success: true,
      plan: 'PREMIUM',
      message: 'Premium subscription activated'
    })
  } catch (error) {
    console.error('SSLCommerz confirmation error:', error)
    return NextResponse.json(
      { success: false, error: 'Confirmation failed' },
      { status: 500 }
    )
  }
}
