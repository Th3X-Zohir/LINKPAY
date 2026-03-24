import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Download, CheckCircle, Clock, XCircle, Mail, Phone, User } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

const serviceCategoryLabels: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  GRAPHIC_DESIGN: 'Graphic Design',
  DATA_ENTRY: 'Data Entry',
  CONSULTING: 'Consulting',
  COPYWRITING: 'Copywriting',
  VIDEO_EDITING: 'Video Editing',
  OTHER: 'Other'
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
  PAID: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { id: paymentLinkId } = await params

  // Fetch the payment link with transactions and user info
  const paymentLink = await db.paymentLink.findUnique({
    where: { id: paymentLinkId },
    select: {
      id: true,
      amount: true,
      description: true,
      status: true,
      serviceCategory: true,
      paidAt: true,
      createdAt: true,
      customerName: true,
      customerEmail: true,
      customerMobile: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessName: true,
          businessAddress: true
        }
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          platformFee: true,
          gatewayFee: true,
          netAmount: true,
          status: true,
          aamarPayTxnId: true,
          createdAt: true
        }
      }
    }
  })

  if (!paymentLink) {
    notFound()
  }

  const successfulTransaction = paymentLink.transactions.find(t => t.status === 'SUCCESS')
  const StatusIcon = statusConfig[paymentLink.status]?.icon || Clock

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {paymentLink.user.businessName ? (
              <span className="text-xl font-bold text-slate-900">{paymentLink.user.businessName}</span>
            ) : (
              <>
                <span className="text-xl font-bold text-slate-900">LinkPay</span>
                <span className="text-xl font-bold text-blue-600">BD</span>
              </>
            )}
          </div>
          <p className="text-slate-500">Payment Invoice Portal</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig[paymentLink.status]?.bg}`}>
                  <StatusIcon className={`w-6 h-6 ${statusConfig[paymentLink.status]?.text}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {paymentLink.status === 'PAID' ? 'Payment Complete' :
                     paymentLink.status === 'PENDING' ? 'Awaiting Payment' :
                     paymentLink.status === 'EXPIRED' ? 'Payment Expired' :
                     'Payment Cancelled'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {paymentLink.status === 'PAID' && successfulTransaction
                      ? `Paid on ${formatDate(successfulTransaction.createdAt)}`
                      : `Created on ${formatDate(paymentLink.createdAt)}`}
                  </p>
                </div>
              </div>
              {paymentLink.status === 'PAID' && (
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Info */}
            <div className="border-b pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Service Category</p>
                  <p className="font-medium">{serviceCategoryLabels[paymentLink.serviceCategory] || 'Other'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Invoice ID</p>
                  <p className="font-mono text-sm">{paymentLink.id.substring(0, 12)}...</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-500">Description</p>
                <p className="font-medium">{paymentLink.description}</p>
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(paymentLink.amount)}</p>
            </div>

            {/* Transaction Details */}
            {successfulTransaction && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-slate-900">Payment Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Transaction ID</p>
                    <p className="font-mono">{successfulTransaction.aamarPayTxnId || successfulTransaction.id.substring(0, 16)}...</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Platform Fee</p>
                    <p>-{formatCurrency(successfulTransaction.platformFee)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Gateway Fee</p>
                    <p>-{formatCurrency(successfulTransaction.gatewayFee)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Net Received</p>
                    <p className="font-semibold text-green-600">{formatCurrency(successfulTransaction.netAmount)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium">{paymentLink.customerName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {paymentLink.customerEmail || 'Not provided'}
                </p>
              </div>
              {paymentLink.customerMobile && (
                <div>
                  <p className="text-sm text-slate-500">Mobile</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {paymentLink.customerMobile}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Provider */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                  {(paymentLink.user.businessName || paymentLink.user.name || 'L').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  {paymentLink.user.businessName || paymentLink.user.name || 'Freelancer'}
                </p>
                <p className="text-sm text-slate-500">{paymentLink.user.email}</p>
                {paymentLink.user.businessAddress && (
                  <p className="text-sm text-slate-500 mt-1">{paymentLink.user.businessAddress}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {paymentLink.status === 'PAID' && successfulTransaction && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 gap-2" asChild>
              <a href={`/api/transactions/${successfulTransaction.id}/invoice/download`} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
                Download Invoice
              </a>
            </Button>
            <Button className="flex-1 gap-2" variant="outline" asChild>
              <a href={`/api/transactions/${successfulTransaction.id}/compliance-pack`} target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4" />
                Compliance Pack
              </a>
            </Button>
          </div>
        )}

        {/* Powered by Footer */}
        {(!paymentLink.user.businessName) && (
          <div className="text-center mt-8 text-sm text-slate-400">
            <p>Powered by <span className="font-semibold">LinkPay BD</span></p>
            <p>Payment Links for Bangladeshi Freelancers</p>
          </div>
        )}
      </div>
    </div>
  )
}