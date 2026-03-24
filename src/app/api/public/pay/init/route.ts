import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAamarPayPayment } from '@/lib/api/aamarPay'
import { createSSLCommerzPayment } from '@/lib/api/sslcommerz'
import { checkRateLimit, RateLimits, createRateLimitHeaders } from '@/lib/rate-limit'
import { createAuditLog } from '@/lib/audit'
import { sanitizeDescription } from '@/lib/sanitize'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Determine which gateway to use - prefer SSLCommerz as primary
function getPreferredGateway(): 'sslcommerz' | 'aamarpay' {
  const sslCommerzConfigured = process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD
  const aamarpayConfigured = process.env.AAMARPAY_STORE_ID && process.env.AAMARPAY_KEY

  // Prefer SSLCommerz if both are configured
  if (sslCommerzConfigured) return 'sslcommerz'
  if (aamarpayConfigured) return 'aamarpay'
  return 'sslcommerz' // Default to SSLCommerz
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ paymentUrl: string }>>> {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  // Apply rate limiting - 10 requests per minute per IP
  const rateLimitKey = `pay-init:${clientIp}`
  if (!checkRateLimit(rateLimitKey, RateLimits.PAYMENT_INIT.limit, RateLimits.PAYMENT_INIT.windowMs)) {
    return NextResponse.json(
      { success: false, error: 'Too many payment requests. Please try again later.' },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitKey, RateLimits.PAYMENT_INIT.limit),
      }
    )
  }

  try {
    const body = await request.json()
    const { shareUrl, gateway } = body

    if (!shareUrl || typeof shareUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'shareUrl is required' },
        { status: 400 }
      )
    }

    // Fetch payment link with user info
    const paymentLink = await db.paymentLink.findUnique({
      where: { shareUrl },
      include: { user: true }
    })

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      )
    }

    // Check if link is still pending
    if (paymentLink.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Payment link is ${paymentLink.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Check if link has expired
    if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Payment link has expired' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const paymentPageUrl = `${appUrl}/pay/${shareUrl}`

    // Sanitize description for audit log
    const sanitizedDescription = sanitizeDescription(paymentLink.description)

    // Log payment initiation
    await createAuditLog({
      action: 'PAYMENT_LINK_SHARED',
      userId: paymentLink.userId,
      metadata: {
        paymentLinkId: paymentLink.id,
        shareUrl,
        amount: paymentLink.amount,
        description: sanitizedDescription,
      },
      ipAddress: clientIp,
      userAgent,
    })

    // Determine which gateway to use
    const preferredGateway = gateway || getPreferredGateway()
    let paymentUrl = ''
    let paymentId = ''
    let gatewayName = ''

    // Try primary gateway (SSLCommerz)
    if (preferredGateway === 'sslcommerz') {
      const sslResult = await createSSLCommerzPayment({
        amount: paymentLink.amount / 100, // Convert from poisha to taka
        description: paymentLink.description,
        customerName: paymentLink.customerName || paymentLink.user.name || 'Customer',
        customerEmail: paymentLink.customerEmail || paymentLink.user.email || '',
        customerMobile: paymentLink.customerMobile || paymentLink.user.phone || '01XXXXXXXXX',
        successUrl: `${paymentPageUrl}/status?result=success&gateway=sslcommerz`,
        failUrl: `${paymentPageUrl}/status?result=failed&gateway=sslcommerz`,
        cancelUrl: `${paymentPageUrl}/status?result=cancelled&gateway=sslcommerz`,
        tranId: `LP_${paymentLink.id.substring(0, 8)}_${Date.now()}`
      })

      if (sslResult.status === 'success' && sslResult.paymentUrl) {
        paymentUrl = sslResult.paymentUrl
        paymentId = sslResult.tranId || ''
        gatewayName = 'sslcommerz'
      } else {
        // SSLCommerz failed, try aamarPay as fallback
        console.warn('SSLCommerz failed, trying aamarPay:', sslResult.error)

        const aamarPayResult = await createAamarPayPayment({
          amount: paymentLink.amount / 100,
          description: paymentLink.description,
          customerName: paymentLink.customerName || paymentLink.user.name || 'Customer',
          customerEmail: paymentLink.customerEmail || paymentLink.user.email || '',
          customerMobile: paymentLink.customerMobile || paymentLink.user.phone || '01XXXXXXXXX',
          successUrl: `${paymentPageUrl}/status?result=success&gateway=aamarpay`,
          failUrl: `${paymentPageUrl}/status?result=failed&gateway=aamarpay`,
          cancelUrl: `${paymentPageUrl}/status?result=cancelled&gateway=aamarpay`
        })

        if (aamarPayResult.status === 'success' && aamarPayResult.payment_id) {
          paymentUrl = aamarPayResult.payment_url || ''
          paymentId = aamarPayResult.payment_id
          gatewayName = 'aamarpay'
        } else {
          return NextResponse.json(
            { success: false, error: aamarPayResult.error || 'Both payment gateways failed. Please try again later.' },
            { status: 500 }
          )
        }
      }
    } else {
      // Try aamarPay as primary
      const aamarPayResult = await createAamarPayPayment({
        amount: paymentLink.amount / 100,
        description: paymentLink.description,
        customerName: paymentLink.customerName || paymentLink.user.name || 'Customer',
        customerEmail: paymentLink.customerEmail || paymentLink.user.email || '',
        customerMobile: paymentLink.customerMobile || paymentLink.user.phone || '01XXXXXXXXX',
        successUrl: `${paymentPageUrl}/status?result=success&gateway=aamarpay`,
        failUrl: `${paymentPageUrl}/status?result=failed&gateway=aamarpay`,
        cancelUrl: `${paymentPageUrl}/status?result=cancelled&gateway=aamarpay`
      })

      if (aamarPayResult.status === 'success' && aamarPayResult.payment_id) {
        paymentUrl = aamarPayResult.payment_url || ''
        paymentId = aamarPayResult.payment_id
        gatewayName = 'aamarpay'
      } else {
        // aamarPay failed, try SSLCommerz as fallback
        console.warn('aamarPay failed, trying SSLCommerz:', aamarPayResult.error)

        const sslResult = await createSSLCommerzPayment({
          amount: paymentLink.amount / 100,
          description: paymentLink.description,
          customerName: paymentLink.customerName || paymentLink.user.name || 'Customer',
          customerEmail: paymentLink.customerEmail || paymentLink.user.email || '',
          customerMobile: paymentLink.customerMobile || paymentLink.user.phone || '01XXXXXXXXX',
          successUrl: `${paymentPageUrl}/status?result=success&gateway=sslcommerz`,
          failUrl: `${paymentPageUrl}/status?result=failed&gateway=sslcommerz`,
          cancelUrl: `${paymentPageUrl}/status?result=cancelled&gateway=sslcommerz`,
          tranId: `LP_${paymentLink.id.substring(0, 8)}_${Date.now()}`
        })

        if (sslResult.status === 'success' && sslResult.paymentUrl) {
          paymentUrl = sslResult.paymentUrl
          paymentId = sslResult.tranId || ''
          gatewayName = 'sslcommerz'
        } else {
          return NextResponse.json(
            { success: false, error: sslResult.error || 'Both payment gateways failed. Please try again later.' },
            { status: 500 }
          )
        }
      }
    }

    // Update payment link with gateway info
    await db.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        aamarPayId: gatewayName === 'aamarpay' ? paymentId : paymentLink.aamarPayId,
        aamarPayUrl: paymentUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl
      },
      message: `Payment initialized successfully via ${gatewayName}`
    })
  } catch (error) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
