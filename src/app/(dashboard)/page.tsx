import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Link as LinkIcon, CreditCard, TrendingUp, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [paymentLinks, transactions, recentTransactions] = await Promise.all([
    db.paymentLink.count({ where: { userId: session.user.id } }),
    db.transaction.count({ where: { userId: session.user.id } }),
    db.transaction.findMany({
      where: { userId: session.user.id, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { paymentLink: true }
    })
  ])

  const totalEarnings = recentTransactions.reduce((sum, t) => sum + t.netAmount, 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Create Payment Link
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Earnings</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-slate-500">From {transactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Payment Links</CardTitle>
            <LinkIcon className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentLinks}</div>
            <p className="text-xs text-slate-500">Created links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Transactions</CardTitle>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions}</div>
            <p className="text-xs text-slate-500">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/dashboard/transactions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Create a payment link to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{tx.paymentLink.description}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-BD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+{formatCurrency(tx.netAmount)}</p>
                    <p className="text-xs text-slate-500">
                      Fee: {formatCurrency(tx.platformFee + tx.gatewayFee)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
