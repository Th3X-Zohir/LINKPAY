'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, CheckCircle, Clock, XCircle, AlertCircle, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RequestPayoutModal } from './RequestPayoutModal'
import type { Payout, PayoutStatus } from '@prisma/client'

interface PayoutWithUser extends Payout {
  user?: {
    bkashNumber: string | null
    bankAccount: string | null
  } | null
}

interface PayoutsClientProps {
  payouts: PayoutWithUser[]
  availableBalance: number
  totalPaidOut: number
  successfulPayoutsCount: number
  userBkashNumber?: string | null
  userBankAccount?: string | null
}

function getStatusBadge(status: PayoutStatus) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" /> Completed
        </Badge>
      )
    case 'PROCESSING':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" /> Processing
        </Badge>
      )
    case 'FAILED':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </Badge>
      )
    case 'PENDING':
      return (
        <Badge variant="outline" className="text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function PayoutsClient({
  payouts,
  availableBalance,
  totalPaidOut,
  successfulPayoutsCount,
  userBkashNumber,
  userBankAccount
}: PayoutsClientProps) {
  const [showRequestModal, setShowRequestModal] = useState(false)

  const pendingAmount = payouts
    .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
    .reduce((sum, p) => sum + p.amount, 0)

  const canRequestPayout = availableBalance >= 500 && userBkashNumber

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
        <p className="text-slate-600">Manage your earnings and withdrawals</p>
      </div>

      {/* Stats Grid */}
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
            <p className="text-sm text-slate-500 mt-1">{successfulPayoutsCount} successful payouts</p>
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

      {/* Request Payout Card */}
      {canRequestPayout ? (
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
                onClick={() => setShowRequestModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Withdraw <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !userBkashNumber ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Configure your payout method</h3>
                <p className="text-sm text-amber-700">
                  Please add your bKash number in settings to request withdrawals
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
            </div>
          ) : (
            <div className="divide-y">
              {payouts.map((payout) => (
                <div key={payout.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(payout.status)}
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
                    <div className="text-xl font-bold">{formatCurrency(payout.amount)}</div>
                    {payout.failureMsg && (
                      <div className="text-sm text-red-600 mt-1">{payout.failureMsg}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Payout Modal */}
      <RequestPayoutModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
        availableBalance={availableBalance}
        userBkashNumber={userBkashNumber}
        userBankAccount={userBankAccount}
        onSuccess={() => {
          // Refresh would happen via router.refresh() or similar
          window.location.reload()
        }}
      />
    </div>
  )
}
