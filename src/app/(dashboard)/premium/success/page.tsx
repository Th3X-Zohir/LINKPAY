'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'

export default function PremiumSuccessPage() {
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get('subscription_id')
  const sslStatus = searchParams.get('status')
  const sslTranId = searchParams.get('TranID')
  const sslValId = searchParams.get('ValID')
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (subscriptionId) {
      // If SSLCommerz returned status=VALID, it means payment was successful
      // and we can confirm immediately without waiting for webhook
      if (sslStatus === 'VALID') {
        confirmSSLCommerzPayment()
      } else {
        verifyPayment()
      }
    } else {
      setError('Invalid subscription')
      setVerifying(false)
    }
  }, [subscriptionId, sslStatus])

  async function confirmSSLCommerzPayment() {
    try {
      const res = await fetch('/api/payments/confirm-sslcz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          tran_id: sslTranId,
          val_id: sslValId,
          status: sslStatus
        })
      })
      const data = await res.json()

      if (data.success) {
        // Payment confirmed successfully
      } else {
        setError(data.error || 'Payment confirmation failed')
      }
    } catch (err) {
      setError('Failed to confirm payment')
    } finally {
      setVerifying(false)
    }
  }

  async function verifyPayment() {
    try {
      const res = await fetch(`/api/payments/verify?subscription_id=${subscriptionId}`)
      const data = await res.json()

      if (data.success && data.plan === 'PREMIUM') {
        // Payment verified successfully - show success state
      } else {
        setError(data.error || 'Payment verification failed')
      }
    } catch (err) {
      setError('Failed to verify payment')
    } finally {
      setVerifying(false)
    }
  }

  if (verifying) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="flex justify-center mb-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment...</h1>
        <p className="text-slate-500">Please wait while we confirm your payment.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Payment Issue</h1>
            <p className="text-red-700 mb-6">{error}</p>
            <Link href="/dashboard/premium">
              <Button className="gap-2">
                Back to Premium <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-green-100">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Premium!</h1>
      <p className="text-slate-600 mb-8">
        Your payment was successful. You now have access to all Premium features.
      </p>
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button size="lg" className="w-full gap-2">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/dashboard/links/new">
          <Button variant="outline" size="lg" className="w-full gap-2">
            Create Your First Payment Link <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
