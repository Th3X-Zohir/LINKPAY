import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreditCard, CheckCircle, XCircle, Clock, ArrowUpRight } from 'lucide-react'
import { InvoiceActions } from './InvoiceActions'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const transactions = await db.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      paymentLink: true,
      user: {
        select: {
          plan: true,
          email: true
        }
      }
    }
  })

  const totalEarnings = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.netAmount, 0)

  const totalFees = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.platformFee + t.gatewayFee, 0)

  function getStatusIcon(status: string) {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'REFUNDED':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-slate-600">View all your payment transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Fees Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{formatCurrency(totalFees)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b">
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Fees</th>
                    <th className="pb-3 font-medium">Net</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="text-sm">
                      <td className="py-4">
                        <div className="font-medium">{tx.paymentLink.description}</div>
                        <div className="text-slate-500 text-xs">
                          ID: {tx.aamarPayTxnId || tx.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-4 font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 text-slate-600">
                        {formatCurrency(tx.platformFee + tx.gatewayFee)}
                      </td>
                      <td className="py-4 font-medium text-green-600">
                        {formatCurrency(tx.netAmount)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <span className="capitalize">{tx.status.toLowerCase()}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {tx.status === 'SUCCESS' && (
                          <InvoiceActions 
                            transactionId={tx.id} 
                            customerEmail={tx.paymentLink.customerEmail || tx.user.email}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
