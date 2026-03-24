'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Transaction {
  id: string
  amount: number
  platformFee: number
  gatewayFee: number
  netAmount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  aamarPayTxnId: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
  paymentLink: { id: string; description: string; shareUrl: string }
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status])

  async function fetchTransactions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status })
      })

      const res = await fetch(`/api/admin/transactions?${params}`)
      const data = await res.json()

      if (data.success) {
        setTransactions(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transaction Management</h1>
        <p className="text-slate-600">View and manage all platform transactions ({total} total)</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by transaction ID or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No transactions found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b">
                      <th className="pb-3 font-medium">Transaction</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Fees</th>
                      <th className="pb-3 font-medium">Net</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="text-sm">
                        <td className="py-4">
                          <div>
                            <p className="font-medium text-xs">
                              {tx.aamarPayTxnId || tx.id.substring(0, 12)}...
                            </p>
                            <p className="text-slate-500 truncate max-w-[200px]">
                              {tx.paymentLink.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{tx.user.name || 'No name'}</p>
                            <p className="text-slate-500 text-xs">{tx.user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 font-medium">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-4 text-slate-600">
                          <div className="text-xs">
                            <div>P: {formatCurrency(tx.platformFee)}</div>
                            <div>G: {formatCurrency(tx.gatewayFee)}</div>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-green-600">
                          {formatCurrency(tx.netAmount)}
                        </td>
                        <td className="py-4">
                          <Badge
                            className={
                              tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                              tx.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                              tx.status === 'REFUNDED' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-slate-500 text-xs">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}