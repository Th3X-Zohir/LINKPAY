import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const notificationTypes = [
  'PAYMENT_RECEIVED',
  'PAYOUT_PROCESSED',
  'PAYOUT_COMPLETED',
  'DISPUTE_OPENED',
  'DISPUTE_RESOLVED',
  'ACCOUNT_LOCKED',
  'WELCOME'
] as const

const updateNotificationSchema = z.object({
  type: z.enum(notificationTypes),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional()
})

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all notification preferences for user
    const preferences = await db.notificationPreference.findMany({
      where: { userId: session.user.id }
    })

    // If no preferences exist, create defaults
    if (preferences.length === 0) {
      const defaultPreferences = await Promise.all(
        notificationTypes.map(async (type) => {
          // Set sensible defaults
          const defaults = {
            PAYMENT_RECEIVED: { emailEnabled: true, smsEnabled: false, pushEnabled: true },
            PAYOUT_PROCESSED: { emailEnabled: true, smsEnabled: false, pushEnabled: true },
            PAYOUT_COMPLETED: { emailEnabled: true, smsEnabled: true, pushEnabled: true },
            DISPUTE_OPENED: { emailEnabled: true, smsEnabled: false, pushEnabled: true },
            DISPUTE_RESOLVED: { emailEnabled: true, smsEnabled: false, pushEnabled: true },
            ACCOUNT_LOCKED: { emailEnabled: true, smsEnabled: true, pushEnabled: true },
            WELCOME: { emailEnabled: true, smsEnabled: false, pushEnabled: true }
          }

          return db.notificationPreference.create({
            data: {
              userId: session.user.id,
              type,
              emailEnabled: defaults[type].emailEnabled,
              smsEnabled: defaults[type].smsEnabled,
              pushEnabled: defaults[type].pushEnabled
            }
          })
        })
      )

      return NextResponse.json({
        success: true,
        data: defaultPreferences.map(p => ({
          type: p.type,
          emailEnabled: p.emailEnabled,
          smsEnabled: p.smsEnabled,
          pushEnabled: p.pushEnabled
        }))
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences.map(p => ({
        type: p.type,
        emailEnabled: p.emailEnabled,
        smsEnabled: p.smsEnabled,
        pushEnabled: p.pushEnabled
      }))
    })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = updateNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { type, emailEnabled, smsEnabled, pushEnabled } = parsed.data

    // Upsert the notification preference
    const preference = await db.notificationPreference.upsert({
      where: {
        userId_type: {
          userId: session.user.id,
          type
        }
      },
      create: {
        userId: session.user.id,
        type,
        emailEnabled: emailEnabled ?? true,
        smsEnabled: smsEnabled ?? false,
        pushEnabled: pushEnabled ?? true
      },
      update: {
        emailEnabled: emailEnabled ?? undefined,
        smsEnabled: smsEnabled ?? undefined,
        pushEnabled: pushEnabled ?? undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        type: preference.type,
        emailEnabled: preference.emailEnabled,
        smsEnabled: preference.smsEnabled,
        pushEnabled: preference.pushEnabled
      },
      message: 'Notification preference updated successfully'
    })
  } catch (error) {
    console.error('Error updating notification preference:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preference' },
      { status: 500 }
    )
  }
}