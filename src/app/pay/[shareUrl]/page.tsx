import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { PaymentForm } from './PaymentForm'

interface PaymentPageProps {
  params: Promise<{ shareUrl: string }>
}

export async function generateMetadata({ params }: PaymentPageProps): Promise<Metadata> {
  const { shareUrl } = await params

  const paymentLink = await db.paymentLink.findUnique({
    where: { shareUrl },
    include: { user: true }
  })

  if (!paymentLink) {
    return { title: 'Payment Link Not Found | LinkPay BD' }
  }

  const sellerName = (paymentLink.user as { businessName?: string | null }).businessName || paymentLink.user.name || 'Freelancer'

  return {
    title: `Pay ${formatCurrency(paymentLink.amount)} to ${sellerName} | LinkPay BD`,
    description: paymentLink.description
  }
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { shareUrl } = await params

  const paymentLink = await db.paymentLink.findUnique({
    where: { shareUrl },
    include: { user: true }
  })

  if (!paymentLink) {
    notFound()
  }

  // Handle different link statuses
  if (paymentLink.status === 'PAID') {
    return <PaymentAlreadyPaid paymentLink={paymentLink} />
  }

  if (paymentLink.status === 'EXPIRED' || (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date())) {
    return <PaymentExpired paymentLink={paymentLink} />
  }

  if (paymentLink.status === 'CANCELLED') {
    return <PaymentCancelled />
  }

  // PENDING - Show payment form with invoice settings
  return <PaymentForm paymentLink={paymentLink} />
}

function PaymentAlreadyPaid({ paymentLink }: { paymentLink: { amount: number; paidAt: Date | null } }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Already Completed</h1>

          <p className="text-slate-600 mb-6">
            This payment link has already been paid.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">Amount Paid</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(paymentLink.amount)}</p>
          </div>

          <p className="text-sm text-slate-500">
            Paid on {paymentLink.paidAt ? new Date(paymentLink.paidAt).toLocaleDateString('en-BD', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}

function PaymentExpired({ paymentLink }: { paymentLink: { amount: number; user: { name?: string | null; businessName?: string | null } } }) {
  const sellerName = paymentLink.user.businessName || paymentLink.user.name || 'Freelancer'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Link Expired</h1>

          <p className="text-slate-600 mb-6">
            This payment link has expired. Please contact the freelancer for a new link.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">Original Amount</p>
            <p className="text-2xl font-bold text-slate-700">{formatCurrency(paymentLink.amount)}</p>
          </div>

          <p className="text-sm text-slate-500">
            For: {sellerName}
          </p>
        </div>
      </div>
    </div>
  )
}

function PaymentCancelled() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>

          <p className="text-slate-600 mb-6">
            This payment link has been cancelled by the freelancer.
          </p>
        </div>
      </div>
    </div>
  )
}
