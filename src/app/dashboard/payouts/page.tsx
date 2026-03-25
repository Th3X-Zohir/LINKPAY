'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, CheckCircle, Clock, XCircle, Loader2, Banknote, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

interface UserSettings {
  bkashNumber: string | null
  bankAccount: string | null
  bankName: string | null
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  // Withdraw dialog state
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'BKASH' | 'BANK'>('BKASH')

  useEffect(() => {
    fetchPayouts()
    fetchBalance()
    fetchUserSettings()
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

  async function fetchUserSettings() {
    try {
      const res = await fetch('/api/users/payout-methods')
      const data = await res.json()
      if (data.success) {
        setUserSettings({
          bkashNumber: data.data?.bkash?.number || null,
          bankAccount: data.data?.bank?.account || null,
          bankName: data.data?.bank?.bankName || null
        })
      }
    } catch (err) {
      console.error('Failed to fetch user settings:', err)
    }
  }

  function openWithdrawDialog() {
    if (!balance) return
    // Default to full available balance
    setWithdrawAmount((balance.available / 100).toString())
    // Default to bKash if available, otherwise bank
    setWithdrawMethod(userSettings?.bkashNumber ? 'BKASH' : 'BANK')
    setWithdrawDialogOpen(true)
  }

  async function requestPayout() {
    if (!balance || !withdrawAmount) return

    const amountInTaka = Math.round(parseFloat(withdrawAmount) * 100)
    const minAmount = 500 // Minimum 5 Taka

    if (isNaN(amountInTaka) || amountInTaka < minAmount) {
      toast.error(`Minimum withdrawal amount is ${formatCurrency(minAmount)}`)
      return
    }

    if (amountInTaka > balance.available) {
      toast.error('Withdrawal amount exceeds available balance')
      return
    }

    setRequesting(true)
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInTaka,
          method: withdrawMethod
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.data?.message || 'Payout requested successfully!')
        setWithdrawDialogOpen(false)
        setWithdrawAmount('')
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

  const availableBalance = balance?.available || 0
  const totalPaidOut = balance?.totalPaidOut || 0
  const pendingAmount = balance?.pendingPayout || 0

  const hasBkash = !!userSettings?.bkashNumber
  const hasBank = !!userSettings?.bankAccount && !!userSettings?.bankName

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

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

      {/* Withdrawal Options */}
      {availableBalance >= 500 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Ready to withdraw?</h3>
                  <p className="text-sm text-green-700">
                    You have {formatCurrency(availableBalance)} available
                  </p>
                </div>
              </div>
              <Button
                onClick={openWithdrawDialog}
                className="bg-green-600 hover:bg-green-700"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Withdraw Funds
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : availableBalance > 0 ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900">Minimum withdrawal not reached</h3>
                <p className="text-sm text-yellow-700">
                  You need at least {formatCurrency(500)} to withdraw. Current balance: {formatCurrency(availableBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Payout History */}
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
                      {payout.method === 'BKASH' ? (
                        <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> bKash</span>
                      ) : (
                        <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> Bank Transfer</span>
                      )}
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

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount you wish to withdraw. Minimum withdrawal is {formatCurrency(500)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BDT)</Label>
              <Input
                id="amount"
                type="number"
                min="5"
                max={(availableBalance / 100).toString()}
                step="1"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Available: {formatCurrency(availableBalance)}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {[1000, 2500, 5000, 10000].map((amount) => {
                const amountInTaka = amount * 100
                if (amountInTaka > availableBalance) return null
                return (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount(amount.toString())}
                  >
                    {formatCurrency(amountInTaka)}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWithdrawAmount((availableBalance / 100).toString())}
              >
                All
              </Button>
            </div>

            {/* Method Selection */}
            <div className="space-y-2">
              <Label>Withdrawal Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('BKASH')}
                  disabled={!hasBkash}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    withdrawMethod === 'BKASH'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${!hasBkash ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="w-5 h-5 text-pink-600" />
                    <span className="font-medium">bKash</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {hasBkash ? `Send to ${userSettings?.bkashNumber}` : 'Not configured'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Instant transfer</p>
                </button>

                <button
                  type="button"
                  onClick={() => setWithdrawMethod('BANK')}
                  disabled={!hasBank}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    withdrawMethod === 'BANK'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${!hasBank ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Bank</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {hasBank ? userSettings?.bankName : 'Not configured'}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">1-3 business days</p>
                </button>
              </div>

              {!hasBkash && !hasBank && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    Please configure your bKash or Bank details in Settings before withdrawing.
                  </p>
                  <Link href="/settings/invoice-settings" className="text-sm text-blue-600 hover:underline mt-1 block">
                    Go to Settings
                  </Link>
                </div>
              )}

              {withdrawMethod === 'BANK' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Bank transfers require manual verification and may take 1-3 business days to process.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={requestPayout}
              disabled={requesting || (!hasBkash && !hasBank) || !withdrawAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {requesting ? 'Processing...' : 'Request Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
