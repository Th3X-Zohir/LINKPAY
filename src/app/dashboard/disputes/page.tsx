'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileDisputeDialog } from '@/components/dispute/file-dispute-dialog'

interface Dispute {
  id: string
  transactionId: string
  reason: string
  description: string
  status: string
  amount: number
  evidenceUrls: string[]
  adminNotes: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

const disputeReasonLabels: Record<string, string> = {
  CLIENT_NOT_PAID: 'Client Not Paid',
  SERVICE_NOT_DELIVERED: 'Service Not Delivered',
  OVERCHARGED: 'Overcharged',
  DUPLICATE_CHARGE: 'Duplicate Charge',
  UNAUTHORIZED_CHARGE: 'Unauthorized Charge',
  OTHER: 'Other'
}

const disputeStatusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  OPEN: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
  UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle },
  RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle }
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [transactions, setTransactions] = useState<{ id: string; amount: number; status: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)

  useEffect(() => {
    fetchDisputes()
    fetchTransactions()
  }, [])

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/disputes')
      const data = await res.json()
      if (data.success) {
        setDisputes(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch disputes')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions')
      const data = await res.json()
      if (data.success) {
        // Filter to only successful transactions that don't have open disputes
        const successfulTransactions = data.data.filter(
          (t: { status: string }) => t.status === 'SUCCESS'
        )
        setTransactions(successfulTransactions)
      }
    } catch (err) {
      console.error('Failed to fetch transactions')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
          <p className="text-slate-600">Manage your payment disputes</p>
        </div>
        {transactions.length > 0 && (
          <div className="flex items-center gap-2">
            <Link href="/dashboard/transactions">
              <Button variant="outline" size="sm">
                View Transactions
              </Button>
            </Link>
            <FileDisputeDialog
              transactionId={transactions[0].id}
              transactionAmount={transactions[0].amount}
              onSuccess={fetchDisputes}
              trigger={
                <Button variant="outline" size="sm">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  File Dispute
                </Button>
              }
            />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Disputes
          </CardTitle>
          <CardDescription>
            {disputes.length} dispute{disputes.length !== 1 ? 's' : ''} filed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No disputes filed yet</p>
              <p className="text-sm">If you have issues with a payment, you can file a dispute here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map(dispute => {
                const StatusIcon = disputeStatusColors[dispute.status]?.icon || Clock
                return (
                  <button
                    type="button"
                    key={dispute.id}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-left"
                    onClick={() => setSelectedDispute(dispute)}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${disputeStatusColors[dispute.status]?.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${disputeStatusColors[dispute.status]?.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {disputeReasonLabels[dispute.reason] || dispute.reason}
                        </p>
                        <Badge className={`${disputeStatusColors[dispute.status]?.bg} ${disputeStatusColors[dispute.status]?.text}`}>
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{formatCurrency(dispute.amount)}</span>
                        <span>-</span>
                        <span>{formatDate(dispute.createdAt)}</span>
                        <span>-</span>
                        <span>ID: {dispute.id.substring(0, 8)}...</span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Dispute Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDispute(null)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Dispute ID</p>
                    <p className="font-mono text-sm">{selectedDispute.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <Badge className={`${disputeStatusColors[selectedDispute.status]?.bg} ${disputeStatusColors[selectedDispute.status]?.text}`}>
                      {selectedDispute.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Reason</p>
                    <p className="font-medium">{disputeReasonLabels[selectedDispute.reason] || selectedDispute.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Amount</p>
                    <p className="font-medium">{formatCurrency(selectedDispute.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Created</p>
                    <p className="font-medium">{formatDate(selectedDispute.createdAt)}</p>
                  </div>
                  {selectedDispute.resolvedAt && (
                    <div>
                      <p className="text-sm text-slate-500">Resolved</p>
                      <p className="font-medium">{formatDate(selectedDispute.resolvedAt)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedDispute.description}</p>
                </div>

                {selectedDispute.adminNotes && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Admin Notes</p>
                    <p className="text-slate-900 bg-blue-50 p-3 rounded-lg">{selectedDispute.adminNotes}</p>
                  </div>
                )}

                {selectedDispute.resolution && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Resolution</p>
                    <p className="text-slate-900 bg-green-50 p-3 rounded-lg">{selectedDispute.resolution}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}