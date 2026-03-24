import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const MIN_PAYOUT_AMOUNT = 50000 // ৳500 in poisha
const MAX_PAYOUT_AMOUNT = 5000000 // ৳50,000 in poisha

export async function GET(request: NextRequest) {
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
    const skip = (page - 1) * limit

    const [payouts, total] = await Promise.all([
      db.payout.findMany({
        where: { userId: session.user.id },
        include: {
          transactions: {
            select: {
              id: true,
              amount: true,
              netAmount: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.payout.count({
        where: { userId: session.user.id }
      })
    ])

    const formattedPayouts = payouts.map(payout => ({
      id: payout.id,
      amount: payout.amount,
      method: payout.method,
      status: payout.status,
      transactionCount: payout.transactions.length,
      totalLinkedAmount: payout.transactions.reduce((sum, t) => sum + t.netAmount, 0),
      transactions: payout.transactions,
      createdAt: payout.createdAt,
      processedAt: payout.processedAt,
      bkashTxnId: payout.bkashTxnId,
      bankTxnId: payout.bankTxnId,
      failureMsg: payout.failureMsg
    }))

    return NextResponse.json({
      success: true,
      data: {
        payouts: formattedPayouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching user payouts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, method } = body

    // Validate amount
    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (amount < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json(
        { success: false, error: `Minimum payout amount is ৳${(MIN_PAYOUT_AMOUNT / 100).toFixed(0)}` },
        { status: 400 }
      )
    }

    if (amount > MAX_PAYOUT_AMOUNT) {
      return NextResponse.json(
        { success: false, error: `Maximum payout amount is ৳${(MAX_PAYOUT_AMOUNT / 100).toFixed(0)}` },
        { status: 400 }
      )
    }

    // Validate method
    if (!method || !['BKASH', 'BANK'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payout method' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check payout method is configured
    if (method === 'BKASH' && !user.bkashNumber) {
      return NextResponse.json(
        { success: false, error: 'Please add your bKash number first' },
        { status: 400 }
      )
    }

    if (method === 'BANK' && !user.bankAccount) {
      return NextResponse.json(
        { success: false, error: 'Please add your bank account first' },
        { status: 400 }
      )
    }

    // Check sufficient balance
    const availableBalance = await db.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      },
      _sum: {
        netAmount: true
      }
    })

    const available = availableBalance._sum.netAmount || 0

    if (amount > available) {
      return NextResponse.json(
        { success: false, error: `Insufficient balance. Available: ৳${(available / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    // Get transactions to link
    const transactions = await db.transaction.findMany({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      },
      orderBy: { createdAt: 'asc' },
      take: 50 // Safety limit
    })

    // Calculate total from transactions until we cover the requested amount
    let linkedAmount = 0
    const transactionIds: string[] = []

    for (const tx of transactions) {
      if (linkedAmount + tx.netAmount <= amount) {
        linkedAmount += tx.netAmount
        transactionIds.push(tx.id)
      } else {
        break
      }
    }

    if (transactionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No transactions available for payout' },
        { status: 400 }
      )
    }

    // Create payout with linked transactions
    const payout = await db.payout.create({
      data: {
        userId: session.user.id,
        amount,
        method: method as 'BKASH' | 'BANK',
        status: 'PENDING',
        transactions: {
          connect: transactionIds.map(id => ({ id }))
        }
      },
      include: {
        transactions: true
      }
    })

    // Update transaction payout status
    await db.transaction.updateMany({
      where: {
        id: { in: transactionIds }
      },
      data: {
        payoutStatus: 'PROCESSING',
        payoutId: payout.id
      }
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PAYOUT_INITIATED',
        details: {
          payoutId: payout.id,
          amount,
          method,
          transactionCount: transactionIds.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        payout: {
          id: payout.id,
          amount: payout.amount,
          method: payout.method,
          status: payout.status,
          transactionCount: payout.transactions.length,
          createdAt: payout.createdAt
        }
      },
      message: 'Payout request created successfully'
    })
  } catch (error) {
    console.error('Error creating payout:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}
