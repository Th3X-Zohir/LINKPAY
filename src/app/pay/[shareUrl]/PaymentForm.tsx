'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Smartphone, ShieldCheck, Clock, Loader2 } from 'lucide-react'

interface PaymentFormProps {
  paymentLink: {
    id: string
    shareUrl: string
    amount: number
    description: string
    customerName: string | null
    customerEmail: string | null
    customerMobile: string | null
    expiresAt: Date | null
    user: {
      id: string
      name: string | null
      email: string
    }
  }
}

export function PaymentForm({ paymentLink }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const initiateUrl = `${appUrl}/api/public/pay/init`

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const shareUrl = formData.get('shareUrl')
      const response = await fetch(initiateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shareUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data?.paymentUrl) {
          window.location.href = data.data.paymentUrl
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Payment initiation failed. Please try again.')
      }
    } catch (error) {
      console.error('Payment initiation failed:', error)
      setError(error instanceof Error ? error.message : 'Payment initiation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LP</span>
            </div>
            <span className="font-semibold text-slate-900">LinkPay BD</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Payment Details Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Card Header */}
          <div className="bg-blue-600 px-6 py-4">
            <p className="text-blue-100 text-sm font-medium">Payment Request From</p>
            <h1 className="text-white text-xl font-bold mt-1">
              {paymentLink.user.name || 'Freelancer'}
            </h1>
          </div>

          {/* Amount */}
          <div className="px-6 py-6 border-b border-slate-100">
            <p className="text-slate-500 text-sm mb-1">Amount to Pay</p>
            <p className="text-4xl font-bold text-slate-900">
              {formatCurrency(paymentLink.amount)}
            </p>
          </div>

          {/* Description */}
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-slate-500 text-sm mb-1">Description</p>
            <p className="text-slate-900">{paymentLink.description}</p>
          </div>

          {/* Customer Info (if provided) */}
          {(paymentLink.customerName || paymentLink.customerEmail || paymentLink.customerMobile) && (
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-slate-500 text-sm mb-2">Customer Information</p>
              {paymentLink.customerName && (
                <p className="text-slate-900 text-sm">{paymentLink.customerName}</p>
              )}
              {paymentLink.customerEmail && (
                <p className="text-slate-600 text-sm">{paymentLink.customerEmail}</p>
              )}
              {paymentLink.customerMobile && (
                <p className="text-slate-600 text-sm">{paymentLink.customerMobile}</p>
              )}
            </div>
          )}

          {/* Deadline */}
          {paymentLink.expiresAt && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Expires {new Date(paymentLink.expiresAt).toLocaleDateString('en-BD', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
            <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Pay Button */}
          <form onSubmit={handleSubmit}>
          <input type="hidden" name="shareUrl" value={paymentLink.shareUrl} />
          <button
            type="submit"
            aria-label="Pay now"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay Now
              </>
            )}
          </button>
        </form>

        {/* Payment Methods */}
        <div className="mt-6">
          <p className="text-center text-slate-500 text-sm mb-4">Secure payment powered by</p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <Smartphone className="w-6 h-6" />
              <span className="text-sm font-medium">bKash</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <CreditCard className="w-6 h-6" />
              <span className="text-sm font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-sm font-medium">Secure</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs">
            By completing this payment, you agree to LinkPay BD&apos;s Terms of Service
          </p>
        </div>
      </main>
    </div>
  )
}
