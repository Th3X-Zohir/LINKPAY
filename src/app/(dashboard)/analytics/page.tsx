import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, CreditCard, Link as LinkIcon, DollarSign, Percent } from 'lucide-react'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [paymentLinks, , recentTransactions] = await Promise.all([
    db.paymentLink.count({ where: { userId: session.user.id } }),
    db.transaction.findMany({
      where: {
        userId: session.user.id,
        status: 'SUCCESS',
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
    db.transaction.findMany({
      where: {
        userId: session.user.id,
        status: 'SUCCESS'
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    })
  ])

  type TxSummary = {
    id: string
    amount: number
    netAmount: number
    platformFee: number
    gatewayFee: number
    createdAt: Date
  }

  const typedRecentTransactions = recentTransactions as TxSummary[]

  const totalEarnings = typedRecentTransactions.reduce((sum: number, t: TxSummary) => sum + t.netAmount, 0)
  const totalAmount = typedRecentTransactions.reduce((sum: number, t: TxSummary) => sum + t.amount, 0)

  const dailyEarnings: Record<string, number> = {}
  typedRecentTransactions.forEach((t: TxSummary) => {
    const date = new Date(t.createdAt).toISOString().split('T')[0]
    dailyEarnings[date] = (dailyEarnings[date] || 0) + t.netAmount
  })

  const sortedDates = Object.keys(dailyEarnings).sort()
  const chartData = sortedDates.slice(-14).map(date => ({
    date,
    earnings: dailyEarnings[date] / 100
  }))

  const successRate = paymentLinks > 0
    ? Math.round((recentTransactions.length / paymentLinks) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600">Track your earnings and performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-slate-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Transactions</CardTitle>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentTransactions.length}</div>
            <p className="text-xs text-slate-500">Successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Payment Links</CardTitle>
            <LinkIcon className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentLinks}</div>
            <p className="text-xs text-slate-500">Created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
            <Percent className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-slate-500">Payment completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Volume</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Platform Fee (0.75%)</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(typedRecentTransactions.reduce((sum: number, t: TxSummary) => sum + t.platformFee, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Gateway Fee (2.55%)</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(typedRecentTransactions.reduce((sum: number, t: TxSummary) => sum + t.gatewayFee, 0))}
              </span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-semibold">You Receive</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(totalEarnings)}</span>
            </div>
            <div className="text-sm text-slate-500 text-center">
              Effective rate: {totalAmount > 0 ? ((totalEarnings / totalAmount) * 100).toFixed(2) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No data yet</p>
                <p className="text-sm">Create payment links to see your analytics</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chartData.slice(-7).reverse().map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 w-20">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((day.earnings / Math.max(...chartData.map(d => d.earnings))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">
                      {formatCurrency(day.earnings * 100)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {typedRecentTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {typedRecentTransactions.slice(0, 5).map((tx: TxSummary) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{formatCurrency(tx.amount)}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
