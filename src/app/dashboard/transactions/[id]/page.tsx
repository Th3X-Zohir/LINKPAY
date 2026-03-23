'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface Transaction {
  id: string
  amount: number
  netAmount: number
  platformFee: number
  gatewayFee: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  payoutStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  aamarPayTxnId: string | null
  createdAt: string
  processedAt: string | null
  paymentLink: {
    id: string
    description: string
    amount: number
    customerName: string | null
    customerEmail: string | null
  }
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransaction()
  }, [params.id])

  async function fetchTransaction() {
    try {
      const res = await fetch(`/api/transactions/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setTransaction(data.data)
      } else {
        toast.error('Transaction not found')
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error)
      toast.error('Failed to load transaction')
    } finally {
      setLoading(false)
    }
  }

  function copyTransactionId() {
    if (!transaction) return
    navigator.clipboard.writeText(transaction.aamarPayTxnId || transaction.id)
    toast.success('Transaction ID copied')
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-700">Success</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case 'REFUNDED':
        return <Badge className="bg-blue-100 text-blue-700">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'REFUNDED':
        return <ArrowUpRight className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  function getPayoutStatusBadge(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case 'PROCESSING':
        return <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>
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

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Transaction Not Found</h2>
        <p className="text-slate-500 mb-4">This transaction may not exist or you don't have access.</p>
        <Link href="/dashboard/transactions">
          <Button>Back to Transactions</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getStatusIcon(transaction.status)}
            {getStatusBadge(transaction.status)}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/links/${transaction.paymentLink.id}`)}
        >
          View Payment Link
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Description</p>
              <p className="font-medium">{transaction.paymentLink.description}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                  {transaction.aamarPayTxnId || transaction.id.substring(0, 12)}...
                </code>
                <Button variant="ghost" size="icon" onClick={copyTransactionId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Date</p>
              <p className="font-medium">{formatDate(transaction.createdAt)}</p>
            </div>

            {transaction.processedAt && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Processed</p>
                <p className="font-medium">{formatDate(transaction.processedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Amount */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Gross Amount</p>
              <p className="text-2xl font-bold">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Platform Fee (0.75%)</span>
                <span className="text-red-600">-{formatCurrency(transaction.platformFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Gateway Fee</span>
                <span className="text-red-600">-{formatCurrency(transaction.gatewayFee)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Net Amount</span>
                <span className="text-green-600">{formatCurrency(transaction.netAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client & Payout Status */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transaction.paymentLink.customerName ? (
              <div>
                <p className="text-sm text-slate-500 mb-1">Name</p>
                <p className="font-medium">{transaction.paymentLink.customerName}</p>
              </div>
            ) : null}

            {transaction.paymentLink.customerEmail ? (
              <div>
                <p className="text-sm text-slate-500 mb-1">Email</p>
                <p className="font-medium">{transaction.paymentLink.customerEmail}</p>
              </div>
            ) : null}

            {!transaction.paymentLink.customerName && !transaction.paymentLink.customerEmail && (
              <p className="text-slate-500">No client information provided</p>
            )}
          </CardContent>
        </Card>

        {/* Payout Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Status</p>
              <div className="mt-1">{getPayoutStatusBadge(transaction.payoutStatus)}</div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Linked Payment Link</p>
              <Link
                href={`/dashboard/links/${transaction.paymentLink.id}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                View Link <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}