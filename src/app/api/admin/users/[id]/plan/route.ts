import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'
import { sendPlanChangeEmail } from '@/lib/email'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ userId: string; newPlan: 'FREE' | 'PREMIUM' }>>> {
  try {
    const adminResponse = await requireAdmin()
    if (adminResponse) return adminResponse

    const { id } = await params

    const body = await request.json()
    const { plan } = body

    if (!plan || !['FREE', 'PREMIUM'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan. Must be FREE or PREMIUM' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, plan: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const previousPlan = user.plan

    // Update user plan
    const updatedUser = await db.user.update({
      where: { id },
      data: { plan }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: id,
        action: 'ADMIN_PLAN_CHANGED',
        details: {
          previousPlan,
          newPlan: plan,
          changedByAdmin: true
        }
      }
    })

    // Send notification email to user
    try {
      await sendPlanChangeEmail({
        to: user.email,
        userName: user.name || 'User',
        newPlan: plan,
        previousPlan
      })
    } catch (emailError) {
      console.error('Failed to send plan change email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedUser.id,
        newPlan: updatedUser.plan
      },
      message: `User plan changed from ${previousPlan} to ${plan}`
    })
  } catch (error) {
    console.error('Admin plan change error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change user plan' },
      { status: 500 }
    )
  }
}
