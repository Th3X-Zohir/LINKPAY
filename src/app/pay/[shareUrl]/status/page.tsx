'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, Loader2, Clock } from 'lucide-react'
import { Suspense } from 'react'

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
  const gateway = searchParams.get('gateway')

  // SSLCommerz returns these directly in URL
  const sslTranId = searchParams.get('TranID')

  const [paymentLink, setPaymentLink] = useState<PaymentLinkDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // SSLCommerz success - call verification endpoint to create transaction
  if (result === 'success' && gateway === 'sslcommerz') {
    return <SSLCommerzSuccess shareUrl={shareUrl} paymentLink={paymentLink} sslTranId={sslTranId} />
  }

  if (result === 'success') {
    return <PaymentSuccess paymentLink={paymentLink} />
  }

  if (result === 'failed') {
    return <PaymentFailed paymentLink={paymentLink} shareUrl={shareUrl} />
  }

  if (result === 'cancelled') {
    return <PaymentCancelled paymentLink={paymentLink} shareUrl={shareUrl} />
  }

  return <UnknownStatus shareUrl={shareUrl} />
}

function PaymentSuccess({ paymentLink }: { paymentLink: PaymentLinkDetails | null }) {
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

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-700">
              The freelancer will be notified and will receive the funds shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SSLCommerzSuccessProps {
  shareUrl: string
  paymentLink: PaymentLinkDetails | null
  sslTranId: string | null
}

function SSLCommerzSuccess({ shareUrl, paymentLink, sslTranId }: SSLCommerzSuccessProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [transaction, setTransaction] = useState<{ id: string; amount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Call the SSLCommerz verification endpoint - pass tran_id if available
        const response = await fetch('/api/payments/verify-sslcz-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareUrl, tran_id: sslTranId })
        })

        const data = await response.json()
        console.log('SSLCommerz verification response:', data)

        if (data.success && data.data) {
          setTransaction(data.data)
          setStatus('success')
        } else if (data.message === 'No transaction found') {
          // Poll again after a short delay
          setTimeout(verifyPayment, 2000)
        } else {
          setError(data.error || data.message || 'Verification failed')
          setStatus('error')
        }
      } catch (err) {
        console.error('SSLCommerz verification error:', err)
        setError('Failed to verify payment')
        setStatus('error')
      }
    }

    verifyPayment()

    // Poll for up to 30 seconds
    const timeout = setTimeout(() => {
      if (status === 'verifying') {
        setError('Payment verification timed out')
        setStatus('error')
      }
    }, 30000)

    return () => clearTimeout(timeout)
  }, [shareUrl, sslTranId])

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment...</h1>
            <p className="text-slate-600 mb-6">
              Please wait while we verify your payment with SSLCommerz.
            </p>

            {paymentLink && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-500 mb-1">Amount</p>
                <p className="text-2xl font-bold text-slate-700">
                  {formatCurrency(paymentLink.amount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Verification Issue</h1>
            <p className="text-slate-600 mb-4">
              {error || 'We could not verify your payment immediately.'}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Your payment may still be processing. The freelancer will receive the funds once confirmed.
            </p>

            {sslTranId && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
                <p className="text-lg font-mono text-slate-700">{sslTranId}</p>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-700">
                Please save your transaction ID for reference.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-600 mb-6">
            Your payment has been processed and verified.
          </p>

          {transaction && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          )}

          {sslTranId && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
              <p className="text-lg font-mono text-slate-700">{sslTranId}</p>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-700">
              The freelancer will be notified and will receive the funds shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentFailed({ paymentLink, shareUrl }: { paymentLink: PaymentLinkDetails | null; shareUrl: string }) {
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
