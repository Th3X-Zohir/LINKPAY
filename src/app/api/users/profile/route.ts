import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional()
})

export async function GET() {
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
        id: true,
        email: true,
        name: true,
        phone: true,
        plan: true,
        bkashNumber: true,
        bankAccount: true,
        bankName: true,
        bankRouting: true,
        bkashVerified: true,
        bankVerified: true,
        emailVerified: true,
        createdAt: true
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
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        plan: user.plan,
        payoutMethods: {
          bkash: user.bkashNumber ? { number: '****' + user.bkashNumber.slice(-3), verified: user.bkashVerified } : null,
          bank: user.bankAccount ? { account: '****' + user.bankAccount.slice(-4), bankName: user.bankName, verified: user.bankVerified } : null
        },
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        plan: true
      }
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        details: parsed.data
      }
    })

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
