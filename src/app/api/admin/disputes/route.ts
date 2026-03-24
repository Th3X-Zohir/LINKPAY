import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const disputes = await db.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: disputes
    })
  } catch (error) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}