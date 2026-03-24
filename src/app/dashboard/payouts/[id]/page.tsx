'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Copy,
  HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Payout {
  id: string
  amount: number
  method: 'BKASH' | 'BANK'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  bkashTxnId: string | null
  bankTxnId: string | null
  failureMsg: string | null
  createdAt: string
  processedAt: string | null
  user: {
    bkashNumber: string | null
    bankAccount: string | null
    bankName: string | null
  }
}

export default function PayoutDetailPage() {
  const params = useParams()
  const [payout, setPayout] = useState<Payout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function fetchPayout() {
    try {
      const res = await fetch(`/api/payouts/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setPayout(data.data)
      } else {
        toast.error('Payout not found')
      }
    } catch (error) {
      console.error('Failed to fetch payout:', error)
      toast.error('Failed to load payout')
    } finally {
      setLoading(false)
    }
  }

  function copyPayoutId() {
    if (!payout) return
    navigator.clipboard.writeText(payout.id)
    toast.success('Payout ID copied')
  }

  function copyBkashTxnId() {
    if (!payout?.bkashTxnId) return
    navigator.clipboard.writeText(payout.bkashTxnId)
    toast.success('bKash Transaction ID copied')
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case 'PROCESSING':
        return <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-slate-400" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!payout) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Payout Not Found</h2>
        <p className="text-slate-500 mb-4">This payout may not exist or you don&apos;t have access.</p>
        <Link href="/dashboard/payouts">
          <Button>Back to Payouts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/payouts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getStatusIcon(payout.status)}
            {getStatusBadge(payout.status)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Payout Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Payout ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                  {payout.id.substring(0, 12)}...
                </code>
                <Button variant="ghost" size="icon" onClick={copyPayoutId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(payout.amount)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Method</p>
              <p className="font-medium">
                {payout.method === 'BKASH' ? 'bKash' : 'Bank Transfer'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Created</p>
              <p className="font-medium">{formatDate(payout.createdAt)}</p>
            </div>

            {payout.processedAt && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Processed</p>
                <p className="font-medium">{formatDate(payout.processedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payout.method === 'BKASH' && (
              <>
                <div>
                  <p className="text-sm text-slate-500 mb-1">bKash Number</p>
                  <p className="font-medium">{payout.user.bkashNumber || 'Not on file'}</p>
                </div>

                {payout.bkashTxnId && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">bKash Transaction ID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                        {payout.bkashTxnId}
                      </code>
                      <Button variant="ghost" size="icon" onClick={copyBkashTxnId}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {payout.method === 'BANK' && (
              <>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Bank</p>
                  <p className="font-medium">{payout.user.bankName || 'Not on file'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Account</p>
                  <p className="font-medium">{payout.user.bankAccount || 'Not on file'}</p>
                </div>

                {payout.bankTxnId && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Bank Reference</p>
                    <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                      {payout.bankTxnId}
                    </code>
                  </div>
                )}
              </>
            )}

            {payout.status === 'FAILED' && payout.failureMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Failure Reason</p>
                    <p className="text-sm text-red-700">{payout.failureMsg}</p>
                  </div>
                </div>
              </div>
            )}

            {payout.status === 'PENDING' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Processing Info</p>
                    <p className="text-sm text-yellow-700">
                      Payouts typically take 1-3 business days to process.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}