import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createSSLCommerzPayment } from '@/lib/api/sslcommerz'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const PREMIUM_PRICE_TAKA = 999 // ৳999/month

export async function POST(): Promise<NextResponse<ApiResponse<{ checkoutUrl: string; paymentId: string }>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, plan: true, phone: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.plan === 'PREMIUM') {
      return NextResponse.json(
        { success: false, error: 'Already a premium member' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create pending subscription record
    const pendingSubscription = await db.pendingSubscription.create({
      data: {
        userId: user.id,
        plan: 'PREMIUM',
        amount: PREMIUM_PRICE_TAKA * 100, // Store in poisha
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })

    // Create SSLCommerz payment for premium subscription
    const paymentResult = await createSSLCommerzPayment({
      amount: PREMIUM_PRICE_TAKA,
      description: 'LinkPay BD Premium Subscription - Monthly',
      customerName: user.name || 'Customer',
      customerEmail: user.email,
      customerMobile: user.phone || 'N/A', // SSLCommerz requires mobile
      successUrl: `${appUrl}/dashboard/premium/success?subscription_id=${pendingSubscription.id}`,
      failUrl: `${appUrl}/dashboard/premium/fail?subscription_id=${pendingSubscription.id}`,
      cancelUrl: `${appUrl}/dashboard/premium`,
      tranId: `SUB_${pendingSubscription.id}_${Date.now()}`
    })

    if (paymentResult.status !== 'success' || !paymentResult.paymentUrl) {
      // Clean up pending subscription on failure
      await db.pendingSubscription.delete({ where: { id: pendingSubscription.id } })

      return NextResponse.json(
        { success: false, error: paymentResult.error || 'Failed to create checkout' },
        { status: 500 }
      )
    }

    // Update pending subscription with SSLCommerz transaction ID
    await db.pendingSubscription.update({
      where: { id: pendingSubscription.id },
      data: { aamarPayId: paymentResult.tranId }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_UPDATED',
        details: {
          action: 'PREMIUM_CHECKOUT_INITIATED',
          subscriptionId: pendingSubscription.id,
          paymentId: paymentResult.tranId,
          amount: PREMIUM_PRICE_TAKA,
          gateway: 'sslcommerz'
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: paymentResult.paymentUrl,
        paymentId: paymentResult.tranId || ''
      },
      message: 'Checkout created successfully'
    })
  } catch (error) {
    console.error('Premium checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create premium checkout' },
      { status: 500 }
    )
  }
}
