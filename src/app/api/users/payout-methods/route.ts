import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'

const bkashSchema = z.object({
  bkashNumber: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid bKash number format')
})

const bankSchema = z.object({
  bankAccount: z.string().min(10, 'Account number must be at least 10 digits').max(18, 'Account number must be at most 18 digits'),
  bankName: z.string().min(2, 'Bank name is required').max(100),
  bankRouting: z.string().regex(/^\d{6}$/, 'Routing number must be 6 digits').optional().or(z.literal(''))
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
        bkashNumber: true,
        bankAccount: true,
        bankName: true,
        bankRouting: true,
        bkashVerified: true,
        bankVerified: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Decrypt sensitive fields for display
    const payoutMethods = {
      bkash: user.bkashNumber
        ? {
            number: user.bkashNumber,
            verified: user.bkashVerified
          }
        : null,
      bank: user.bankAccount
        ? {
            account: user.bankAccount,
            bankName: user.bankName,
            routing: user.bankRouting,
            verified: user.bankVerified
          }
        : null
    }

    return NextResponse.json({
      success: true,
      data: payoutMethods
    })
  } catch (error) {
    console.error('Error fetching payout methods:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payout methods' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    const responseData: Record<string, unknown> = {}

    // Validate and prepare bKash update if provided
    if (body.bkashNumber !== undefined) {
      const bkashResult = bkashSchema.safeParse(body)
      if (!bkashResult.success) {
        return NextResponse.json(
          { success: false, error: bkashResult.error.errors[0].message },
          { status: 400 }
        )
      }
      updateData.bkashNumber = bkashResult.data.bkashNumber
      updateData.bkashVerified = false
      responseData.bkash = {
        number: bkashResult.data.bkashNumber, // Return unmasked for form editing
        verified: false
      }
    }

    // Validate and prepare bank update if provided
    if (body.bankAccount !== undefined) {
      const bankResult = bankSchema.safeParse(body)
      if (!bankResult.success) {
        return NextResponse.json(
          { success: false, error: bankResult.error.errors[0].message },
          { status: 400 }
        )
      }
      updateData.bankAccount = bankResult.data.bankAccount
      updateData.bankName = bankResult.data.bankName
      updateData.bankRouting = bankResult.data.bankRouting || null
      updateData.bankVerified = false
      responseData.bank = {
        account: bankResult.data.bankAccount, // Return unmasked for form editing
        bankName: bankResult.data.bankName,
        routing: bankResult.data.bankRouting,
        verified: false
      }
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update user in database
    await db.user.update({
      where: { id: session.user.id },
      data: updateData
    })

    // Create audit logs
    if (body.bkashNumber !== undefined) {
      await createAuditLog({
        action: 'USER_UPDATED',
        userId: session.user.id,
        metadata: {
          method: 'payout-method',
          type: 'bkash_updated',
          last3: body.bkashNumber.slice(-3)
        },
        ipAddress: clientIp,
        userAgent,
      })
    }

    if (body.bankAccount !== undefined) {
      await createAuditLog({
        action: 'USER_UPDATED',
        userId: session.user.id,
        metadata: {
          method: 'payout-method',
          type: 'bank_updated',
          bankName: body.bankName,
          last4: body.bankAccount.slice(-4)
        },
        ipAddress: clientIp,
        userAgent,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payout methods updated successfully',
      data: responseData
    })
  } catch (error) {
    console.error('Error updating payout methods:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payout methods' },
      { status: 500 }
    )
  }
}
