import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
): Promise<NextResponse<ApiResponse<{
  id: string
  amount: number
  status: string
  aamarPayTxnId: string | null
  createdAt: string
} | null>>> {
  try {
    const { shareUrl } = await params
    
    // First get the payment link
    const paymentLink = await db.paymentLink.findUnique({
      where: { shareUrl },
      select: { id: true }
    })
    
    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      )
    }
    
    // Then get the successful transaction if any
    const transaction = await db.transaction.findFirst({
      where: {
        paymentLinkId: paymentLink.id,
        status: 'SUCCESS'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (!transaction) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No transaction found'
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        aamarPayTxnId: transaction.aamarPayTxnId,
        createdAt: transaction.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
