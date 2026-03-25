'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentLinkCardSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Copy, ExternalLink, MoreHorizontal, Clock, CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface PaymentLink {
  id: string
  amount: number
  description: string
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'
  shareUrl: string
  createdAt: string
  transactions: Array<{
    amount: number
  }>
}

export default function PaymentLinksPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentLinks()
  }, [])

  async function fetchPaymentLinks() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payment-links')
      const data = await res.json()
      if (data.success) {
        setPaymentLinks(data.data)
      } else {
        setError(data.error || 'Failed to fetch payment links')
      }
    } catch (err) {
      setError('Failed to fetch payment links')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> Paid</Badge>
      case 'PENDING':
        return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Expired</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Cancelled</Badge>
      default:
        return <Badge variant="muted" className="gap-1"><Clock className="w-3 h-3" /> {status}</Badge>
    }
  }

  function copyLink(shareUrl: string) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${shareUrl}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Links</h1>
            <p className="text-slate-500">Manage your payment links</p>
          </div>
          <Link href="/dashboard/links/new">
            <Button className="gap-2 h-11">
              <Plus className="w-4 h-4" /> Create Payment Link
            </Button>
          </Link>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <PaymentLinkCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Links</h1>
            <p className="text-slate-500">Manage your payment links</p>
          </div>
          <Link href="/dashboard/links/new">
            <Button className="gap-2 h-11">
              <Plus className="w-4 h-4" /> Create Payment Link
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Links</h1>
          <p className="text-slate-500">Manage your payment links</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button className="gap-2 h-11 px-5 font-medium shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Create Payment Link
          </Button>
        </Link>
      </div>

      {paymentLinks.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            {/* Empty state illustration */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200/50">
              <LinkIcon className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No payment links yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first payment link to start accepting payments from clients worldwide.</p>
            <Link href="/dashboard/links/new">
              <Button className="gap-2 h-11 px-6 shadow-lg shadow-blue-500/20">
                <Plus className="w-4 h-4" /> Create Payment Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentLinks.map((link) => {
            const paidAmount = link.transactions.reduce((sum, t) => sum + t.amount, 0)
            return (
              <Card key={link.id} className="border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      {getStatusBadge(link.status)}
                      <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">{link.description}</h3>
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{formatCurrency(link.amount)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Payment link actions" className="min-h-[44px] min-w-[44px] hover:bg-blue-50">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <a href={`/pay/${link.shareUrl}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <ExternalLink className="w-4 h-4" /> View Page
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(link.shareUrl)} className="gap-2">
                          <Copy className="w-4 h-4" /> Copy Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Created {formatDate(link.createdAt)}</span>
                    {link.status === 'PAID' && (
                      <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Received: {formatCurrency(paidAmount)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}