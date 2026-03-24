'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, ArrowUpRight, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Payout {
  id: string
  amount: number
  method: 'BKASH' | 'BANK'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  bkashTxnId: string | null
  bankTxnId: string | null
  failureReason: string | null
  createdAt: Date
  processedAt: Date | null
}

interface BalanceData {
  available: number
  pendingPayout: number
  totalPaidOut: number
  lifetimeEarnings: number
  pendingTransactionCount: number
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    fetchPayouts()
    fetchBalance()
  }, [])

  async function fetchPayouts() {
    try {
      const res = await fetch('/api/payouts')
      const data = await res.json()
      if (data.success && data.data?.payouts) {
        setPayouts(data.data.payouts)
      }
    } catch (err) {
      console.error('Failed to fetch payouts:', err)
    }
  }

  async function fetchBalance() {
    try {
      const res = await fetch('/api/payouts/balance')
      const data = await res.json()
      if (data.success) {
        setBalance(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    } finally {
      setLoading(false)
    }
  }

  async function requestPayout() {
    if (!balance || balance.available < 500) return

    setRequesting(true)
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: balance.available,
          method: 'BKASH'
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Payout requested successfully!')
        fetchPayouts()
        fetchBalance()
      } else {
        toast.error(data.error || 'Failed to request payout')
      }
    } catch (err) {
      toast.error('Failed to request payout')
      console.error(err)
    } finally {
      setRequesting(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>
      case 'PROCESSING':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> Processing</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const availableBalance = balance?.available || 0
  const totalPaidOut = balance?.totalPaidOut || 0
  const pendingAmount = balance?.pendingPayout || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
        <p className="text-slate-600">Manage your earnings and withdrawals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(availableBalance)}</div>
            <p className="text-sm text-slate-500 mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPaidOut)}</div>
            <p className="text-sm text-slate-500 mt-1">{payouts.filter(p => p.status === 'COMPLETED').length} successful payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-sm text-slate-500 mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {availableBalance >= 500 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Ready to withdraw?</h3>
                  <p className="text-sm text-green-700">
                    You have {formatCurrency(availableBalance)} available for withdrawal to bKash
                  </p>
                </div>
              </div>
              <Button
                onClick={requestPayout}
                disabled={requesting}
                className="bg-green-600 hover:bg-green-700"
              >
                {requesting ? 'Processing...' : 'Withdraw'} <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No payouts yet</p>
              <p className="text-sm">Your withdrawal history will appear here</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/links/new">Create a payment link to earn money</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {payouts.map((payout) => (
                <div key={payout.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getStatusBadge(payout.status)}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {payout.method === 'BKASH' ? 'bKash' : 'Bank Transfer'}
                      {payout.bkashTxnId && ` • ${payout.bkashTxnId.substring(0, 12)}...`}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDate(payout.createdAt)}
                      {payout.processedAt && ` • Processed: ${formatDate(payout.processedAt)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <Link href={`/dashboard/payouts/${payout.id}`} className="text-xl font-bold hover:underline">
                      {formatCurrency(payout.amount)}
                    </Link>
                    {payout.failureReason && (
                      <div className="text-sm text-red-600 mt-1">{payout.failureReason}</div>
                    )}
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