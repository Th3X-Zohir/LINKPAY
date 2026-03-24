import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PayoutsClient } from './PayoutsClient'

export default async function PayoutsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [payouts, pendingTransactions, user] = await Promise.all([
    db.payout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    }),
    db.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        payoutStatus: 'PENDING'
      },
      _sum: { netAmount: true }
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { bkashNumber: true, bankAccount: true }
    })
  ])

  const availableBalance = pendingTransactions._sum.netAmount || 0

  const successfulPayouts = payouts.filter(p => p.status === 'COMPLETED')
  const totalPaidOut = successfulPayouts.reduce((sum, p) => sum + p.amount, 0)

  return (
    <PayoutsClient
      payouts={payouts}
      availableBalance={availableBalance}
      totalPaidOut={totalPaidOut}
      successfulPayoutsCount={successfulPayouts.length}
      userBkashNumber={user?.bkashNumber}
      userBankAccount={user?.bankAccount}
    />
  )
}
