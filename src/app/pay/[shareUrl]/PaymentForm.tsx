'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Smartphone, ShieldCheck, Clock, Loader2, Building2, MapPin } from 'lucide-react'
import Image from 'next/image'

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
      businessName?: string | null
      businessAddress?: string | null
      businessLogo?: string | null
    }
  }
}

export function PaymentForm({ paymentLink }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const initiateUrl = `${appUrl}/api/public/pay/init`

  // Use business branding if available, otherwise fall back to user info
  const sellerName = paymentLink.user.businessName || paymentLink.user.name || 'Freelancer'
  const hasCustomBranding = paymentLink.user.businessName || paymentLink.user.businessLogo

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
      {/* Header with Business Branding */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {hasCustomBranding ? (
            // Custom business branding
            <div className="flex items-center gap-3">
              {paymentLink.user.businessLogo ? (
                <div className="w-10 h-10 relative rounded-lg overflow-hidden shadow-sm">
                  <Image
                    src={paymentLink.user.businessLogo}
                    alt={sellerName}
                    fill
                    className="object-contain"
                    unoptimized={paymentLink.user.businessLogo.startsWith('http')}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-900 block">{sellerName}</span>
                {paymentLink.user.businessAddress && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {paymentLink.user.businessAddress}
                  </span>
                )}
              </div>
            </div>
          ) : (
            // Default LinkPay branding
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <span className="font-semibold text-slate-900">LinkPay BD</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Payment Details Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden mb-6 border border-slate-100">
          {/* Card Header with Seller Info */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5">
            <p className="text-blue-100 text-sm font-medium">Payment Request From</p>
            <div className="flex items-center gap-3 mt-2">
              {paymentLink.user.businessLogo ? (
                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-white shadow-lg">
                  <Image
                    src={paymentLink.user.businessLogo}
                    alt={sellerName}
                    fill
                    className="object-contain p-1"
                    unoptimized={paymentLink.user.businessLogo.startsWith('http')}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-white text-xl font-bold">{sellerName}</h1>
                {paymentLink.user.businessAddress && (
                  <p className="text-blue-200 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {paymentLink.user.businessAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="px-6 py-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <p className="text-slate-500 text-sm mb-1">Amount to Pay</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-[1.02] active:scale-[0.98]"
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

        {/* Seller Contact Info (if available) */}
        {paymentLink.user.businessAddress && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Payment secured by LinkPay BD • {sellerName}
            </p>
          </div>
        )}

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
