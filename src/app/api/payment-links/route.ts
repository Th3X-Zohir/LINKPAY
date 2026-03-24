import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createPaymentLinkSchema } from '@/lib/validators'
import { createPayment } from '@/lib/api/payment-gateway'

// Transaction limits based on KYC level (stored in poisha)
const TRANSACTION_LIMITS = {
  UNVERIFIED: 100000, // ৳1,000
  BASIC: 1000000,     // ৳10,000
  FULL: 10000000      // ৳1,00,000
} as const

type KycLevel = 'UNVERIFIED' | 'BASIC' | 'FULL'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentLinks = await db.paymentLink.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          where: { status: 'SUCCESS' }
        }
      }
    })

    return NextResponse.json({ success: true, data: paymentLinks })
  } catch (error) {
    console.error('Error fetching payment links:', error)
    return NextResponse.json({ error: 'Failed to fetch payment links' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createPaymentLinkSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { amount, description, customerName, customerEmail, customerMobile, serviceCategory, expiresAt } = parsed.data

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check transaction limit based on KYC level
    const kycLevel = (user.kycLevel || 'UNVERIFIED') as KycLevel
    const limit = TRANSACTION_LIMITS[kycLevel] || TRANSACTION_LIMITS.UNVERIFIED

    if (amount > limit) {
      return NextResponse.json({
        error: `Transaction amount exceeds your limit of ৳${(limit / 100).toLocaleString('en-BD')} for ${kycLevel === 'UNVERIFIED' ? 'unverified' : kycLevel === 'BASIC' ? 'basic' : 'full'} KYC level. Please upgrade your account or complete KYC verification.`
      }, { status: 400 })
    }

    const shareUrl = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`

    const paymentLink = await db.paymentLink.create({
      data: {
        userId: session.user.id,
        amount,
        description,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerMobile: customerMobile || null,
        serviceCategory: serviceCategory || 'OTHER',
        shareUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PAYMENT_LINK_CREATED',
        details: { paymentLinkId: paymentLink.id, amount }
      }
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const paymentUrl = `${appUrl}/pay/${shareUrl}`

    // Use unified createPayment from payment-gateway.ts
    const paymentResult = await createPayment({
      amount: amount / 100, // Convert to BDT from poisha
      description,
      customerName: customerName || user.name || 'Customer',
      customerEmail: customerEmail || user.email || '',
      customerMobile: customerMobile || user.phone || '01XXXXXXXXX',
      successUrl: `${paymentUrl}/success`,
      failUrl: `${paymentUrl}/fail`,
      cancelUrl: `${paymentUrl}/cancel`,
      gateway: body.gateway || 'aamarpay'
    })

    if (paymentResult.success && paymentResult.paymentId) {
      await db.paymentLink.update({
        where: { id: paymentLink.id },
        data: {
          aamarPayId: paymentResult.paymentId, // Generic field for gateway transaction ID
          aamarPayUrl: paymentResult.paymentUrl
        }
      })
    } else {
      console.error('Payment creation failed:', paymentResult.error)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...paymentLink,
        paymentUrl: `${appUrl}/pay/${shareUrl}`,
        gateway: paymentResult.gateway
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}