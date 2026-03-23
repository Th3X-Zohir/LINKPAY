import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ shareUrl: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shareUrl } = await params

    const paymentLink = await db.paymentLink.findUnique({
      where: { shareUrl },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        amount: paymentLink.amount,
        description: paymentLink.description,
        customerName: paymentLink.customerName,
        status: paymentLink.status,
        createdAt: paymentLink.createdAt,
        userName: paymentLink.user.name,
        minAmount: 100,
        maxAmount: 10000000
      }
    })
  } catch (error) {
    console.error('Error fetching payment link:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment link' },
      { status: 500 }
    )
  }
}
