import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateInvoiceSettingsSchema = z.object({
  businessName: z.string().min(1).max(100).optional(),
  businessAddress: z.string().max(500).optional(),
  businessLogo: z.string().url().optional().or(z.literal('')),
  defaultPaymentTerms: z.string().max(1000).optional()
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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        businessName: true,
        businessAddress: true,
        businessLogo: true,
        defaultPaymentTerms: true,
        plan: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching invoice settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice settings' },
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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Only premium users can customize invoices
    if (user.plan !== 'PREMIUM') {
      return NextResponse.json(
        { success: false, error: 'Invoice customization is only available for Premium users' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateInvoiceSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        businessName: parsed.data.businessName,
        businessAddress: parsed.data.businessAddress,
        businessLogo: parsed.data.businessLogo,
        defaultPaymentTerms: parsed.data.defaultPaymentTerms
      },
      select: {
        businessName: true,
        businessAddress: true,
        businessLogo: true,
        defaultPaymentTerms: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Invoice settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating invoice settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice settings' },
      { status: 500 }
    )
  }
}