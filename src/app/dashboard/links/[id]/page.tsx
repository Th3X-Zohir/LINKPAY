'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Share2,
  Loader2
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface PaymentLink {
  id: string
  amount: number
  description: string
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'
  shareUrl: string
  aamarPayId: string | null
  customerName: string | null
  customerEmail: string | null
  customerMobile: string | null
  createdAt: string
  expiresAt: string | null
  transactions: Array<{
    id: string
    amount: number
    netAmount: number
    status: string
    createdAt: string
  }>
}

export default function PaymentLinkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPaymentLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function fetchPaymentLink() {
    try {
      const res = await fetch(`/api/payment-links/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setPaymentLink(data.data)
        setEditDescription(data.data.description)
        setEditAmount(data.data.amount.toString())
        setEditExpiresAt(data.data.expiresAt ? new Date(data.data.expiresAt).toISOString().slice(0, 16) : '')
      }
    } catch (error) {
      console.error('Failed to fetch payment link:', error)
      toast.error('Failed to load payment link')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!paymentLink) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/payment-links/${paymentLink.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Payment link deleted')
        router.push('/dashboard/links')
      } else {
        const data = await res.json()
        toast.error(data.error?.message || 'Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete payment link')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  async function handleSaveEdit() {
    if (!paymentLink) return
    setSaving(true)

    try {
      const updateData: { description: string; amount?: number; expiresAt?: string | null } = {
        description: editDescription
      }

      if (editAmount) {
        updateData.amount = parseInt(editAmount, 10)
      }

      if (editExpiresAt) {
        updateData.expiresAt = new Date(editExpiresAt).toISOString()
      }

      const res = await fetch(`/api/payment-links/${paymentLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        toast.success('Payment link updated')
        setEditMode(false)
        fetchPaymentLink()
      } else {
        const data = await res.json()
        toast.error(data.error?.message || 'Failed to update')
      }
    } catch (error) {
      toast.error('Failed to update payment link')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    if (!paymentLink) return
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentLink.shareUrl}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-700">Expired</Badge>
      case 'CANCELLED':
        return <Badge className="bg-slate-100 text-slate-700">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'EXPIRED':
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!paymentLink) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Payment Link Not Found</h2>
        <p className="text-slate-500 mb-4">This payment link may have been deleted or you don&apos;t have access.</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => fetchPaymentLink()} variant="outline">
            Try Again
          </Button>
          <Link href="/dashboard/links">
            <Button>Back to Links</Button>
          </Link>
        </div>
      </div>
    )
  }

  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentLink.shareUrl}`
  const totalReceived = paymentLink.transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/links" className="hover:text-slate-700">Links</Link>
        <span>/</span>
        <span className="text-slate-900">{paymentLink.description}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/links">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {getStatusIcon(paymentLink.status)}
              {getStatusBadge(paymentLink.status)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {paymentLink.status !== 'PAID' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Link Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Link Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (BDT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="100"
                    max="10000000"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="font-medium">{paymentLink.description}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(paymentLink.amount)}
                  </p>
                </div>

                {paymentLink.customerName && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Client</p>
                    <p className="font-medium">{paymentLink.customerName}</p>
                  </div>
                )}

                {paymentLink.customerEmail && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Client Email</p>
                    <p className="font-medium">{paymentLink.customerEmail}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-500 mb-1">Created</p>
                  <p className="font-medium">{formatDate(paymentLink.createdAt)}</p>
                </div>

                {paymentLink.expiresAt && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Expires</p>
                    <p className="font-medium">{formatDate(paymentLink.expiresAt)}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-500 mb-1">aamarPay ID</p>
                  <p className="font-medium text-xs">{paymentLink.aamarPayId || 'N/A'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Share & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Payment Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={paymentUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full bg-green-600 hover:bg-green-700 gap-2">
                <a
                  href={`https://wa.me/?text=Pay%20here%3A%20${encodeURIComponent(paymentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share via WhatsApp
                </a>
              </Button>

              <Button asChild variant="outline" className="w-full gap-2">
                <a
                  href={`mailto:?subject=Payment Request&body=Please%20pay%20here%3A%20${encodeURIComponent(paymentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share via Email
                </a>
              </Button>

              <Button asChild variant="outline" className="w-full gap-2">
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Payment Page
                </a>
              </Button>
            </div>

            {/* QR Code placeholder */}
            <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
              <QRCodeSVG value={paymentUrl} size={128} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({paymentLink.transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentLink.transactions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-4">
              {paymentLink.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{formatCurrency(tx.amount)}</p>
                    <p className="text-sm text-slate-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {paymentLink.status === 'PAID' && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Received</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(totalReceived)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment link? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Processing...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}