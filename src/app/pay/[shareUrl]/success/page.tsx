'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Loader2, Copy } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'

interface TransactionDetails {
  id: string
  amount: number
  aamarPayTxnId: string | null
  status: string
  createdAt: string
}

interface PaymentLinkDetails {
  id: string
  shareUrl: string
  amount: number
  description: string
  user: {
    name: string | null
    email: string
  }
}

function PaymentSuccessContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shareUrl = params.shareUrl as string
  const gateway = searchParams.get('gateway')

  const [paymentLink, setPaymentLink] = useState<PaymentLinkDetails | null>(null)
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch payment link details
        const plResponse = await fetch(`/api/public/pay/${shareUrl}`)
        if (plResponse.ok) {
          const plData = await plResponse.json()
          setPaymentLink(plData.data)
        }

        // Fetch transaction details
        const txnResponse = await fetch(`/api/public/pay/${shareUrl}/transaction`)
        if (txnResponse.ok) {
          const txnData = await txnResponse.json()
          if (txnData.data) {
            setTransaction(txnData.data)
          }
        }
      } catch (error) {
        console.error('Error fetching payment details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [shareUrl])

  const handleCopyTxnId = () => {
    if (transaction?.aamarPayTxnId) {
      navigator.clipboard.writeText(transaction.aamarPayTxnId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>

          <p className="text-slate-600 mb-6">
            Your payment has been processed successfully. The freelancer will be notified.
          </p>

          {paymentLink && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(paymentLink.amount)}
              </p>
            </div>
          )}

          {transaction && transaction.aamarPayTxnId && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-mono text-slate-700">
                  {transaction.aamarPayTxnId}
                </p>
                <button
                  onClick={handleCopyTxnId}
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                  aria-label="Copy transaction ID"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
            </div>
          )}

          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-700">
              A confirmation email has been sent to the freelancer.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard/transactions">
              <Button variant="outline" className="w-full">
                View Transactions
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Return to Home
              </Button>
            </Link>
          </div>

          {gateway && (
            <p className="text-xs text-slate-400 mt-4">
              Payment processed via {gateway === 'sslcommerz' ? 'SSLCommerz' : 'aamarPay'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
