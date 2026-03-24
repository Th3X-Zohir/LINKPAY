import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createPaymentLinkSchema } from '@/lib/validators'
import { createAamarPayPayment } from '@/lib/api/aamarPay'

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

    const { amount, description, customerName, customerEmail, customerMobile, expiresAt } = parsed.data

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    const aamarPayResult = await createAamarPayPayment({
      amount: amount / 100,
      description,
      customerName: customerName || user.name || 'Customer',
      customerEmail: customerEmail || user.email || '',
      customerMobile: customerMobile || user.phone || '01XXXXXXXXX',
      successUrl: `${paymentUrl}/success`,
      failUrl: `${paymentUrl}/fail`,
      cancelUrl: `${paymentUrl}/cancel`
    })

    if (aamarPayResult.status === 'success' && aamarPayResult.payment_id) {
      await db.paymentLink.update({
        where: { id: paymentLink.id },
        data: {
          aamarPayId: aamarPayResult.payment_id,
          aamarPayUrl: aamarPayResult.payment_url
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...paymentLink,
        paymentUrl: `${appUrl}/pay/${shareUrl}`
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
