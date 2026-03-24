import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface TransactionInfo {
  id: string
  status: string
  aamarPayTxnId: string | null
  paymentLink: {
    description: string
  }
}

interface InvoiceWithTransaction {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  createdAt: Date
  transaction: TransactionInfo | null
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ invoices: InvoiceWithTransaction[]; pagination: { total: number; page: number; limit: number } }>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: Record<string, unknown> = {
      userId: session.user.id
    }

    if (status) {
      whereClause.status = status
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        (whereClause.createdAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        ;(whereClause.createdAt as Record<string, Date>).lte = endOfDay
      }
    }

    const total = await db.invoice.count({
      where: whereClause
    })

    const invoices = await db.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const invoicesWithTransactions: InvoiceWithTransaction[] = await Promise.all(
      invoices.map(async (invoice) => {
        let transaction: TransactionInfo | null = null
        if (invoice.transactionId) {
          const tx = await db.transaction.findUnique({
            where: { id: invoice.transactionId },
            include: {
              paymentLink: {
                select: {
                  description: true
                }
              }
            }
          })
          if (tx) {
            transaction = {
              id: tx.id,
              status: tx.status,
              aamarPayTxnId: tx.aamarPayTxnId,
              paymentLink: {
                description: tx.paymentLink.description
              }
            }
          }
        }
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          status: invoice.status,
          createdAt: invoice.createdAt,
          transaction
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoicesWithTransactions,
        pagination: {
          total,
          page,
          limit
        }
      }
    })
  } catch (error) {
    console.error('Invoice list error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}