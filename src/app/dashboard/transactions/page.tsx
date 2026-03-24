'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreditCard, CheckCircle, XCircle, Clock, ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Transaction {
  id: string
  amount: number
  netAmount: number
  platformFee: number
  gatewayFee: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  aamarPayTxnId: string | null
  createdAt: string
  paymentLink: {
    id: string
    description: string
  }
}

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/transactions?page=${page}&limit=20`)
      const data = await res.json()
      if (data.success) {
        setTransactions(data.data)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        setError(data.error || 'Failed to fetch transactions')
      }
    } catch (err) {
      setError('Failed to fetch transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600">View all your payment transactions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600">View all your payment transactions</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
              {error}
            </div>
            <Button onClick={fetchTransactions} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
              <Button asChild className="mt-4">
                <Link href="/dashboard/links/new">Create your first payment link</Link>
              </Button>
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
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="text-sm hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                    >
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}