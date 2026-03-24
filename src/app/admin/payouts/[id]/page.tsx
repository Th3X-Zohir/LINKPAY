'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  CreditCard,
  Wallet
} from 'lucide-react'

interface PayoutDetail {
  id: string
  amount: number
  method: 'BKASH' | 'BANK'
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'CANCELLED'
  bkashTxnId: string | null
  bankTxnId: string | null
  failureMsg: string | null
  processedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    bkashNumber: string | null
    bankAccount: string | null
    bankName: string | null
  }
  transactions: Array<{
    id: string
    amount: number
    platformFee: number
    netAmount: number
    status: string
    createdAt: string
  }>
}

export default function AdminPayoutDetailPage() {
  const params = useParams()
  const [payout, setPayout] = useState<PayoutDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchPayout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function fetchPayout() {
    try {
      const res = await fetch(`/api/admin/payouts?id=${params.id}`)
      const data = await res.json()

      if (data.success && data.data.length > 0) {
        setPayout(data.data[0])
      } else {
        setError('Payout not found')
      }
    } catch (err) {
      setError('Failed to fetch payout')
    } finally {
      setLoading(false)
    }
  }

  async function approvePayout() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts/${params.id}/approve`, {
        method: 'POST'
      })

      if (res.ok) {
        fetchPayout()
      }
    } catch (err) {
      console.error('Failed to approve payout:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function rejectPayout() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts/${params.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      })

      if (res.ok) {
        setShowRejectDialog(false)
        fetchPayout()
      }
    } catch (err) {
      console.error('Failed to reject payout:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function executePayout() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts/${params.id}/execute`, {
        method: 'POST'
      })

      if (res.ok) {
        fetchPayout()
      }
    } catch (err) {
      console.error('Failed to execute payout:', err)
    } finally {
      setActionLoading(false)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'FAILED':
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'PROCESSING':
      case 'APPROVED':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-slate-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />
    }
  }

  function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'FAILED':
      case 'REJECTED':
        return 'destructive'
      case 'PROCESSING':
      case 'APPROVED':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full" />
      </div>
    )
  }

  if (error || !payout) {
    return (
      <div className="space-y-6">
        <Link href="/admin/payouts">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Payouts
          </Button>
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">{error || 'Payout not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/payouts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Payout Details</h1>
            <p className="text-slate-600">ID: {payout.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(payout.status)} className="gap-1">
            {getStatusIcon(payout.status)}
            {payout.status}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      {payout.status === 'PENDING' && (
        <div className="flex gap-2">
          <Button
            onClick={approvePayout}
            disabled={actionLoading}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            disabled={actionLoading}
            className="gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
        </div>
      )}

      {payout.status === 'APPROVED' && (
        <div className="flex gap-2">
          <Button
            onClick={executePayout}
            disabled={actionLoading}
            className="gap-2"
          >
            <Wallet className="w-4 h-4" />
            Execute Payout
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payout Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payout Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(payout.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Method</p>
                <p className="font-medium">{payout.method}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Created</p>
                <p className="font-medium">{formatDate(payout.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Processed</p>
                <p className="font-medium">
                  {payout.processedAt ? formatDate(payout.processedAt) : 'Not yet'}
                </p>
              </div>
              {payout.bkashTxnId && (
                <div>
                  <p className="text-sm text-slate-600">bKash Txn ID</p>
                  <p className="font-medium font-mono text-sm">{payout.bkashTxnId}</p>
                </div>
              )}
              {payout.bankTxnId && (
                <div>
                  <p className="text-sm text-slate-600">Bank Txn ID</p>
                  <p className="font-medium font-mono text-sm">{payout.bankTxnId}</p>
                </div>
              )}
              {payout.failureMsg && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-600">Failure Message</p>
                  <p className="font-medium text-red-600">{payout.failureMsg}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-medium">{payout.user.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-medium">{payout.user.email}</p>
              </div>
              {payout.method === 'BKASH' && payout.user.bkashNumber && (
                <div>
                  <p className="text-sm text-slate-600">bKash Number</p>
                  <p className="font-medium">{payout.user.bkashNumber}</p>
                </div>
              )}
              {payout.method === 'BANK' && (
                <>
                  <div>
                    <p className="text-sm text-slate-600">Bank</p>
                    <p className="font-medium">{payout.user.bankName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Account</p>
                    <p className="font-medium">{payout.user.bankAccount || 'Not set'}</p>
                  </div>
                </>
              )}
            </div>
            <div className="pt-2">
              <Link href={`/admin/users/${payout.user.id}`}>
                <Button variant="outline" size="sm">
                  View User Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Linked Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Linked Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payout.transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No linked transactions</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Fee</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Net</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payout.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b">
                        <td className="py-3 px-4 font-mono text-sm">{tx.id.slice(0, 8)}...</td>
                        <td className="py-3 px-4">{formatCurrency(tx.amount)}</td>
                        <td className="py-3 px-4">{formatCurrency(tx.platformFee)}</td>
                        <td className="py-3 px-4">{formatCurrency(tx.netAmount)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={tx.status === 'SUCCESS' ? 'default' : 'secondary'}>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason (optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter rejection reason..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={rejectPayout}>Reject</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
