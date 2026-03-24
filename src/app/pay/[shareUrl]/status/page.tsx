'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Copy } from 'lucide-react'
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
  amount: number
  description: string
  user: {
    name: string | null
    email: string
  }
}

function PaymentStatusContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shareUrl = params.shareUrl as string
  const result = searchParams.get('result')

  const [paymentLink, setPaymentLink] = useState<PaymentLinkDetails | null>(null)
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Use ref to track refresh count and prevent infinite loops
  const refreshCountRef = useRef(0)
  const MAX_REFRESHES = 10

  useEffect(() => {
    // Fetch payment link details
    async function fetchData() {
      try {
        const response = await fetch(`/api/public/pay/${shareUrl}`)
        if (response.ok) {
          const data = await response.json()
          setPaymentLink(data.data)
        }
      } catch (error) {
        console.error('Error fetching payment link:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [shareUrl])

  // Auto-refresh when processing - using ref to avoid dependency issues
  useEffect(() => {
    if (result === 'success' && !transaction && refreshCountRef.current < MAX_REFRESHES) {
      const interval = setInterval(async () => {
        if (refreshCountRef.current >= MAX_REFRESHES) {
          clearInterval(interval)
          return
        }

        try {
          const response = await fetch(`/api/public/pay/${shareUrl}/transaction`)
          if (response.ok) {
            const data = await response.json()
            if (data.data) {
              setTransaction(data.data)
              setLoading(false)
              clearInterval(interval)
            }
          }
          refreshCountRef.current += 1
        } catch (error) {
          console.error('Error fetching transaction:', error)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [result, shareUrl, transaction])

  // Countdown timer for processing status
  useEffect(() => {
    if (result === 'success' && !transaction) {
      setTimeRemaining(30) // 30 seconds max
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [result, transaction])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading payment details...</p>
        </div>
      </div>
    )
  }
  
  if (result === 'success') {
    return <PaymentSuccess paymentLink={paymentLink} transaction={transaction} timeRemaining={timeRemaining} />
  }
  
  if (result === 'failed') {
    return <PaymentFailed paymentLink={paymentLink} />
  }
  
  if (result === 'cancelled') {
    return <PaymentCancelled paymentLink={paymentLink} shareUrl={shareUrl} />
  }
  
  return <UnknownStatus shareUrl={shareUrl} />
}

function PaymentSuccess({
  paymentLink,
  transaction,
  timeRemaining
}: {
  paymentLink: PaymentLinkDetails | null
  transaction: TransactionDetails | null
  timeRemaining: number
}) {
  const [copied, setCopied] = useState(false)
  
  const handleCopyTxnId = () => {
    if (transaction?.aamarPayTxnId) {
      navigator.clipboard.writeText(transaction.aamarPayTxnId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  if (!transaction && timeRemaining > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Processing Payment</h1>
            
            <p className="text-slate-600 mb-6">
              Please wait while we confirm your payment...
            </p>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Time remaining</p>
              <p className="text-2xl font-bold text-slate-700">{timeRemaining}s</p>
            </div>
            
            <p className="text-xs text-slate-400">
              Do not close this page. It will update automatically.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          
          <p className="text-slate-600 mb-6">
            Your payment has been processed successfully.
          </p>
          
          {paymentLink && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(paymentLink.amount)}
              </p>
            </div>
          )}
          
          {transaction && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-mono text-slate-700">
                  {transaction.aamarPayTxnId || 'N/A'}
                </p>
                {transaction.aamarPayTxnId && (
                  <button
                    onClick={handleCopyTxnId}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
              {copied && (
                <p className="text-xs text-green-600 mt-1">Copied!</p>
              )}
            </div>
          )}
          
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-700">
              The freelancer will be notified and will receive the funds shortly.
            </p>
          </div>
          
          <p className="text-xs text-slate-400">
            A confirmation email has been sent to the freelancer.
          </p>
        </div>
      </div>
    </div>
  )
}

function PaymentFailed({ paymentLink }: { paymentLink: PaymentLinkDetails | null }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
          
          <p className="text-slate-600 mb-6">
            Unfortunately, your payment could not be processed.
          </p>
          
          {paymentLink && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Amount</p>
              <p className="text-2xl font-bold text-slate-700">
                {formatCurrency(paymentLink.amount)}
              </p>
            </div>
          )}
          
          <div className="bg-amber-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">
              Please try again or contact support if the problem persists.
            </p>
          </div>
          
          <a
            href={`/pay/${paymentLink?.id}`}
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    </div>
  )
}

function PaymentCancelled({ paymentLink, shareUrl }: { paymentLink: PaymentLinkDetails | null; shareUrl: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
          
          <p className="text-slate-600 mb-6">
            The payment was cancelled. No charges have been made.
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">For</p>
            <p className="text-lg font-semibold text-slate-700">
              {paymentLink?.description || 'Payment'}
            </p>
          </div>
          
          <a
            href={`/pay/${shareUrl}`}
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    </div>
  )
}

function UnknownStatus({ shareUrl }: { shareUrl: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-slate-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Unknown Status</h1>

          <p className="text-slate-600 mb-6">
            We could not determine the payment status.
          </p>

          <a
            href={`/pay/${shareUrl}`}
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Return to Payment
          </a>
        </div>
      </div>
    </div>
  )
}

// Wrap in Suspense for Next.js 15 useSearchParams requirement
export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  )
}
