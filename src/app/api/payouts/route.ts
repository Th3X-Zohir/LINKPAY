import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requestPayoutSchema } from '@/lib/validators'
import { initiateBkashPayout } from '@/lib/api/bkash'
import { checkRateLimit, RateLimits, createRateLimitHeaders } from '@/lib/rate-limit'
import { createAuditLog } from '@/lib/audit'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payouts = await db.payout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    const successfulPayouts = payouts.filter(p => p.status === 'COMPLETED')
    const totalPayout = successfulPayouts.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        payouts,
        summary: {
          totalPayout,
          pendingPayout: payouts
            .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
            .reduce((sum, p) => sum + p.amount, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  // Apply rate limiting - 5 requests per minute per user
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimitKey = `payout:${session.user.id}`
  if (!checkRateLimit(rateLimitKey, RateLimits.PAYOUT_REQUEST.limit, RateLimits.PAYOUT_REQUEST.windowMs)) {
    return NextResponse.json(
      { error: 'Too many payout requests. Please try again later.' },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitKey, RateLimits.PAYOUT_REQUEST.limit),
      }
    )
  }

  try {
    const body = await request.json()
    const parsed = requestPayoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { amount, method } = parsed.data

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const availableEarnings = await db.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      },
      _sum: { netAmount: true }
    })

    const pending = availableEarnings._sum.netAmount || 0

    if (amount > pending) {
      return NextResponse.json(
        { error: `Insufficient earnings. Available: ৳${(pending / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    if (method === 'BKASH') {
      if (!user.bkashNumber) {
        return NextResponse.json(
          { error: 'Please add your bKash number first' },
          { status: 400 }
        )
      }

      const reference = `LP-${Date.now().toString(36)}`
      const payoutResult = await initiateBkashPayout(amount / 100, user.bkashNumber, reference)

      // Determine payout status based on bKash API result
      let payoutStatus: 'PROCESSING' | 'PENDING' = 'PROCESSING'
      let bkashTxnId: string | null = null
      let failureReason: string | null = null

      if (payoutResult.status !== 'success') {
        // bKash API failed - create pending payout for manual admin processing
        payoutStatus = 'PENDING'
        failureReason = payoutResult.error || 'bKash API unavailable - requires manual processing'
      } else {
        bkashTxnId = payoutResult.trxId ?? null
      }

      const payout = await db.payout.create({
        data: {
          userId: session.user.id,
          amount,
          method: 'BKASH',
          status: payoutStatus,
          bkashTxnId,
          failureMsg: payoutStatus === 'FAILED' ? failureReason : null
        }
      })

      // Only mark enough transactions to cover the payout amount (oldest first)
      const pendingTransactions = await db.transaction.findMany({
        where: {
          userId: session.user.id,
          status: 'SUCCESS',
          payoutStatus: 'PENDING'
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, netAmount: true }
      })

      let remainingAmount = amount
      const transactionsToUpdate: string[] = []

      for (const tx of pendingTransactions) {
        if (remainingAmount <= 0) break
        transactionsToUpdate.push(tx.id)
        remainingAmount -= tx.netAmount
      }

      if (transactionsToUpdate.length > 0) {
        await db.transaction.updateMany({
          where: {
            id: { in: transactionsToUpdate }
          },
          data: {
            payoutStatus: 'PROCESSING',
            payoutId: payout.id
          }
        })
      }

      await createAuditLog({
        action: 'PAYOUT_INITIATED',
        userId: session.user.id,
        metadata: {
          payoutId: payout.id,
          amount,
          method: 'BKASH',
          bkashTxnId: bkashTxnId,
          status: payoutStatus,
        },
        ipAddress: clientIp,
        userAgent,
      })

      const message = payoutStatus === 'PENDING'
        ? 'Withdrawal request submitted for manual processing. You will be notified once processed.'
        : 'Payout initiated successfully'

      return NextResponse.json({
        success: true,
        data: {
          id: payout.id,
          status: payout.status,
          trxId: bkashTxnId,
          message
        }
      })
    }

    // Bank Transfer - Create pending payout record for manual/external processing
    if (method === 'BANK') {
      if (!user.bankAccount || !user.bankName) {
        return NextResponse.json(
          { error: 'Please add your bank details first in Settings' },
          { status: 400 }
        )
      }

      // Create a pending payout record
      const payout = await db.payout.create({
        data: {
          userId: session.user.id,
          amount,
          method: 'BANK',
          status: 'PENDING' // Bank transfers require manual verification
        }
      })

      // Only mark enough transactions to cover the payout amount (oldest first)
      const pendingTransactions = await db.transaction.findMany({
        where: {
          userId: session.user.id,
          status: 'SUCCESS',
          payoutStatus: 'PENDING'
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, netAmount: true }
      })

      let remainingAmount = amount
      const transactionsToUpdate: string[] = []

      for (const tx of pendingTransactions) {
        if (remainingAmount <= 0) break
        transactionsToUpdate.push(tx.id)
        remainingAmount -= tx.netAmount
      }

      if (transactionsToUpdate.length > 0) {
        await db.transaction.updateMany({
          where: {
            id: { in: transactionsToUpdate }
          },
          data: {
            payoutStatus: 'PROCESSING',
            payoutId: payout.id
          }
        })
      }

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PAYOUT_INITIATED',
          details: {
            payoutId: payout.id,
            amount,
            method: 'BANK',
            bankName: user.bankName,
            bankAccount: user.bankAccount.substring(0, 4) + '****' // Masked for security
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: payout.id,
          status: payout.status,
          message: 'Bank transfer request submitted. Processing typically takes 1-3 business days.'
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid payout method' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 })
  }
}
