import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const upgradeSchema = z.object({
  action: z.enum(['initiate_upgrade'])
})

interface SubscriptionStatus {
  plan: 'FREE' | 'PREMIUM'
  features: {
    maxPaymentLinks: number
    customBranding: boolean
    prioritySupport: boolean
    advancedAnalytics: boolean
    noWatermark: boolean
  }
  usage?: {
    linksCreated: number
    linksRemaining: number
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const FREE_FEATURES = {
  maxPaymentLinks: 10,
  customBranding: false,
  prioritySupport: false,
  advancedAnalytics: false,
  noWatermark: false
}

const PREMIUM_FEATURES = {
  maxPaymentLinks: -1, // Unlimited
  customBranding: true,
  prioritySupport: true,
  advancedAnalytics: true,
  noWatermark: true
}

export async function GET(): Promise<NextResponse<ApiResponse<SubscriptionStatus>>> {
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
      select: {
        plan: true,
        paymentLinks: {
          select: { id: true },
          where: { status: { not: 'CANCELLED' } }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const isPremium = user.plan === 'PREMIUM'
    const features = isPremium ? PREMIUM_FEATURES : FREE_FEATURES
    const linksCreated = user.paymentLinks.length

    const status: SubscriptionStatus = {
      plan: user.plan,
      features,
      usage: {
        linksCreated,
        linksRemaining: isPremium ? -1 : Math.max(0, FREE_FEATURES.maxPaymentLinks - linksCreated)
      }
    }

    return NextResponse.json({ success: true, data: status })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ checkoutUrl: string }>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = upgradeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', message: validation.error.message },
        { status: 400 }
      )
    }

    const { action } = validation.data

    if (action === 'initiate_upgrade') {
      // For now, redirect to premium page - payment integration would go here
      const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium`

      return NextResponse.json({
        success: true,
        data: { checkoutUrl },
        message: 'Redirect to premium checkout page'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Subscription action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process subscription action' },
      { status: 500 }
    )
  }
}
