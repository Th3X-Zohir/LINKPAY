import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { encryptNid, decryptNid } from '@/lib/encryption'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh phone number').optional().or(z.literal('')),
  nid: z.string().max(20).optional().or(z.literal('')),
  businessName: z.string().max(200).optional().or(z.literal('')),
  businessAddress: z.string().max(500).optional().or(z.literal('')),
  bkashNumber: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid bKash number').optional().or(z.literal('')),
  bankName: z.string().max(100).optional().or(z.literal('')),
  bankAccount: z.string().max(50).optional().or(z.literal('')),
  bankRouting: z.string().max(20).optional().or(z.literal(''))
})

/**
 * Mask NID for display - shows only last 4 digits
 * Example: "1234567890123" -> "************0123"
 */
function maskNid(nid: string | null | undefined): string {
  if (!nid) return ''
  if (nid.length <= 4) return '****'
  return '*'.repeat(nid.length - 4) + nid.slice(-4)
}

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
        kycLevel: true,
        nid: true,
        businessName: true,
        businessAddress: true,
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

    // Decrypt NID if it exists (stored encrypted)
    const decryptedNid = user.nid ? decryptNid(user.nid) : null

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        plan: user.plan,
        kycLevel: user.kycLevel,
        nid: maskNid(decryptedNid), // Return masked NID for display
        businessName: user.businessName || '',
        businessAddress: user.businessAddress || '',
        bkashNumber: user.bkashNumber || '',
        bankAccount: user.bankAccount ? '****' + user.bankAccount.slice(-4) : '', // Masked
        bankName: user.bankName || '',
        bankRouting: user.bankRouting || '',
        bkashVerified: user.bkashVerified || false,
        bankVerified: user.bankVerified || false,
        emailVerified: user.emailVerified,
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

    // Prepare data for update - encrypt NID if provided
    const updateData: Record<string, unknown> = { ...parsed.data }

    // Encrypt NID before storing
    if (updateData.nid) {
      updateData.nid = encryptNid(updateData.nid as string)
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        plan: true,
        kycLevel: true
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
