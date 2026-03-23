import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ExternalLink, Calendar, User } from 'lucide-react'

interface PaymentPageProps {
  params: Promise<{ shareUrl: string }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { shareUrl } = await params

  const paymentLink = await db.paymentLink.findUnique({
    where: { shareUrl },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!paymentLink) {
    notFound()
  }

  if (paymentLink.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
            <p className="text-slate-600">This payment link has been cancelled.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentLink.status === 'PAID') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Already Paid</h1>
            <p className="text-slate-600">This payment has already been completed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentLink.expiresAt && new Date() > paymentLink.expiresAt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏰</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Payment Expired</h1>
            <p className="text-slate-600">This payment link has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePay = async () => {
    if (paymentLink.aamarPayUrl) {
      window.location.href = paymentLink.aamarPayUrl
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">LP</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Request</h1>
          <p className="text-slate-600">via LinkPay BD</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Pending Payment
              </Badge>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {formatDate(paymentLink.createdAt)}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-blue-600">
              {formatCurrency(paymentLink.amount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-slate-700 font-medium">{paymentLink.description}</p>
              {paymentLink.customerName && (
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4" />
                  {paymentLink.customerName}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-slate-500 mb-2">Payment for</p>
              <p className="font-medium">{paymentLink.user.name || 'Freelancer'}</p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePay}
              disabled={!paymentLink.aamarPayUrl}
            >
              {paymentLink.aamarPayUrl ? (
                <>
                  Pay Now <ExternalLink className="w-4 h-4 ml-2" />
                </>
              ) : (
                'Payment processing...'
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              Secure payment via aamarPay. Accepts Visa, Mastercard, bKash.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-8">
          Powered by <span className="font-medium text-blue-600">LinkPay BD</span>
        </p>
      </div>
    </div>
  )
}
