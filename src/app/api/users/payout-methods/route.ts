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

    // Validate bKash update
    if ('bkashNumber' in body) {
      const parsed = bkashSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        )
      }

      await db.user.update({
        where: { id: session.user.id },
        data: {
          bkashNumber: parsed.data.bkashNumber, // Store decrypted for lookup
          bkashVerified: false // Reset verification when changed
        }
      })

      await createAuditLog({
        action: 'USER_UPDATED',
        userId: session.user.id,
        metadata: {
          method: 'payout-method',
          type: 'bkash_updated',
          last3: parsed.data.bkashNumber.slice(-3)
        },
        ipAddress: clientIp,
        userAgent,
      })

      return NextResponse.json({
        success: true,
        message: 'bKash number updated successfully',
        data: {
          bkash: {
            number: '01XXXXXXXXX' + parsed.data.bkashNumber.slice(-3),
            verified: false
          }
        }
      })
    }

    // Validate bank update
    if ('bankAccount' in body) {
      const parsed = bankSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        )
      }

      await db.user.update({
        where: { id: session.user.id },
        data: {
          bankAccount: parsed.data.bankAccount, // Store decrypted for lookup
          bankName: parsed.data.bankName,
          bankRouting: parsed.data.bankRouting || null,
          bankVerified: false // Reset verification when changed
        }
      })

      await createAuditLog({
        action: 'USER_UPDATED',
        userId: session.user.id,
        metadata: {
          method: 'payout-method',
          type: 'bank_updated',
          bankName: parsed.data.bankName,
          last4: parsed.data.bankAccount.slice(-4)
        },
        ipAddress: clientIp,
        userAgent,
      })

      return NextResponse.json({
        success: true,
        message: 'Bank details updated successfully',
        data: {
          bank: {
            account: '****' + parsed.data.bankAccount.slice(-4),
            bankName: parsed.data.bankName,
            routing: parsed.data.bankRouting,
            verified: false
          }
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid update payload' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating payout methods:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payout methods' },
      { status: 500 }
    )
  }
}
