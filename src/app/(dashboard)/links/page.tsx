import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Copy, ExternalLink, MoreHorizontal, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

async function getStatusIcon(status: string) {
  switch (status) {
    case 'PAID':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'PENDING':
      return <Clock className="w-4 h-4 text-yellow-600" />
    case 'EXPIRED':
    case 'CANCELLED':
      return <XCircle className="w-4 h-4 text-red-600" />
    default:
      return <Clock className="w-4 h-4 text-slate-400" />
  }
}

async function getStatusText(status: string) {
  switch (status) {
    case 'PAID':
      return 'Paid'
    case 'PENDING':
      return 'Pending'
    case 'EXPIRED':
      return 'Expired'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

export default async function PaymentLinksPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const paymentLinks = await db.paymentLink.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      transactions: {
        where: { status: 'SUCCESS' }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Links</h1>
          <p className="text-slate-600">Manage your payment links</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Create Link
          </Button>
        </Link>
      </div>

      {paymentLinks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No payment links yet</h3>
            <p className="text-slate-500 mb-6">Create your first payment link to start accepting payments</p>
            <Link href="/dashboard/links/new">
              <Button>Create Payment Link</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentLinks.map((link) => {
            const paidAmount = link.transactions.reduce((sum, t) => sum + t.amount, 0)
            return (
              <Card key={link.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(link.status)}
                        <span className="font-medium">{getStatusText(link.status)}</span>
                      </div>
                      <h3 className="font-semibold text-lg">{link.description}</h3>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(link.amount)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/pay/${link.shareUrl}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" /> View Page
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/pay/${link.shareUrl}`)
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" /> Copy Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                    <span>Created {formatDate(link.createdAt)}</span>
                    {link.status === 'PAID' && (
                      <span className="text-green-600">Received: {formatCurrency(paidAmount)}</span>
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
