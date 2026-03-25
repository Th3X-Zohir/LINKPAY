'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowRight } from 'lucide-react'

export default function PremiumFailPage() {
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get('subscription_id')

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-red-100">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Failed</h1>
      <p className="text-slate-600 mb-8">
        Your payment could not be processed. Please try again or contact support if the issue persists.
      </p>
      {subscriptionId && (
        <p className="text-sm text-slate-500 mb-8">
          Reference: {subscriptionId}
        </p>
      )}
      <div className="space-y-4">
        <Link href="/dashboard/premium">
          <Button size="lg" className="w-full gap-2">
            Try Again <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" size="lg" className="w-full gap-2">
            Back to Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
