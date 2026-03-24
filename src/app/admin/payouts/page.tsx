'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Payout {
  id: string
  amount: number
  method: 'BKASH' | 'BANK'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  bkashTxnId: string | null
  bankTxnId: string | null
  failureReason: string | null
  createdAt: string
  processedAt: string | null
  user: { id: string; name: string | null; email: string; bkashNumber: string | null }
  transaction: { id: string; amount: number }
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Update dialog state
  const [updateDialog, setUpdateDialog] = useState<{ open: boolean; payout: Payout | null }>({
    open: false,
    payout: null
  })
  const [updateStatus, setUpdateStatus] = useState<'PROCESSING' | 'COMPLETED' | 'FAILED'>('PROCESSING')
  const [txId, setTxId] = useState('')
  const [failureReason, setFailureReason] = useState('')

  useEffect(() => {
    fetchPayouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  async function fetchPayouts() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(status && { status })
      })

      const res = await fetch(`/api/admin/payouts?${params}`)
      const data = await res.json()

      if (data.success) {
        setPayouts(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePayout() {
    if (!updateDialog.payout) return

    try {
      const res = await fetch(`/api/admin/payouts?id=${updateDialog.payout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          bkashTxnId: txId || undefined,
          failureReason: failureReason || undefined
        })
      })

      if (res.ok) {
        setUpdateDialog({ open: false, payout: null })
        fetchPayouts()
      }
    } catch (error) {
      console.error('Failed to update payout:', error)
    }
  }

  function openUpdateDialog(payout: Payout) {
    setUpdateDialog({ open: true, payout })
    setUpdateStatus('PROCESSING')
    setTxId('')
    setFailureReason('')
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'PROCESSING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payout Management</h1>
        <p className="text-slate-600">Manage all platform payouts ({total} total)</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No payouts found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Method</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Txn ID</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="text-sm">
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{payout.user.name || 'No name'}</p>
                            <p className="text-slate-500 text-xs">{payout.user.email}</p>
                            <p className="text-slate-400 text-xs">{payout.user.bkashNumber}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline">{payout.method}</Badge>
                        </td>
                        <td className="py-4 font-medium">
                          {formatCurrency(payout.amount)}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payout.status)}
                            <span>{payout.status}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-500 text-xs">
                          {payout.bkashTxnId || payout.bankTxnId || '-'}
                        </td>
                        <td className="py-4 text-slate-500 text-xs">
                          <div>{formatDate(payout.createdAt)}</div>
                          {payout.processedAt && (
                            <div>Processed: {formatDate(payout.processedAt)}</div>
                          )}
                        </td>
                        <td className="py-4">
                          {payout.status !== 'COMPLETED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUpdateDialog(payout)}
                            >
                              Update
                            </Button>
                          )}
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

      {/* Update Dialog */}
      <Dialog open={updateDialog.open} onOpenChange={(open) => setUpdateDialog({ open, payout: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payout Status</DialogTitle>
            <DialogDescription>
              Update the status of this payout. This will be visible to the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value as 'PROCESSING' | 'COMPLETED' | 'FAILED')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {updateStatus === 'COMPLETED' && (
              <div className="space-y-2">
                <Label>bKash Transaction ID</Label>
                <Input
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="Enter bKash transaction ID"
                />
              </div>
            )}

            {updateStatus === 'FAILED' && (
              <div className="space-y-2">
                <Label>Failure Reason</Label>
                <Input
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Enter reason for failure"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog({ open: false, payout: null })}>
              Cancel
            </Button>
            <Button onClick={updatePayout}>Update Payout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}