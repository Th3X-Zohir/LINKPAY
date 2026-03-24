'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  Crown,
  CreditCard,
  Link as LinkIcon,
  Wallet
} from 'lucide-react'

interface UserDetail {
  id: string
  email: string
  name: string | null
  phone: string | null
  plan: 'FREE' | 'PREMIUM'
  bkashNumber: string | null
  bkashVerified: boolean
  bankVerified: boolean
  isAdmin: boolean
  createdAt: string
  totalVolume: number
  totalPlatformFees: number
  paymentLinks: Array<{
    id: string
    amount: number
    description: string
    status: string
    shareUrl: string
    createdAt: string
    _count: { transactions: number }
  }>
  transactions: Array<{
    id: string
    amount: number
    platformFee: number
    netAmount: number
    status: string
    aamarPayTxnId: string | null
    createdAt: string
  }>
  payouts: Array<{
    id: string
    amount: number
    method: string
    status: string
    createdAt: string
    processedAt: string | null
  }>
  _count: {
    paymentLinks: number
    transactions: number
    payouts: number
  }
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [showVerifyBkash, setShowVerifyBkash] = useState(false)
  const [showVerifyBank, setShowVerifyBank] = useState(false)
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [newPlan, setNewPlan] = useState<'FREE' | 'PREMIUM'>('FREE')

  useEffect(() => {
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function fetchUser() {
    try {
      const res = await fetch(`/api/admin/users/${params.id}`)
      const data = await res.json()

      if (data.success) {
        setUser(data.data)
        setNewPlan(data.data.plan)
      } else {
        setError(data.error?.message || 'Failed to fetch user')
      }
    } catch (err) {
      setError('Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }

  async function updateUser(updates: Record<string, unknown>) {
    setActionLoading('updating')
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (res.ok) {
        fetchUser()
      }
    } catch (err) {
      console.error('Failed to update user:', err)
    } finally {
      setActionLoading(null)
    }
  }

  async function verifyBkash() {
    await updateUser({ bkashVerified: true })
    setShowVerifyBkash(false)
  }

  async function verifyBank() {
    await updateUser({ bankVerified: true })
    setShowVerifyBank(false)
  }

  async function changePlan() {
    await updateUser({ plan: newPlan })
    setShowChangePlan(false)
  }

  async function toggleAdmin() {
    if (!user) return
    await updateUser({ isAdmin: !user.isAdmin })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Button>
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">{error || 'User not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{user.name || 'Unnamed User'}</h1>
            <p className="text-slate-600">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={toggleAdmin}
            disabled={actionLoading !== null}
          >
            <Shield className="w-4 h-4" />
            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={user.plan === 'PREMIUM' ? 'default' : 'secondary'}>
          <Crown className="w-3 h-3 mr-1" />
          {user.plan}
        </Badge>
        {user.isAdmin && (
          <Badge variant="default">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )}
        <Badge variant={user.bkashVerified ? 'default' : 'outline'}>
          bKash {user.bkashVerified ? 'Verified' : 'Unverified'}
        </Badge>
        <Badge variant={user.bankVerified ? 'default' : 'outline'}>
          Bank {user.bankVerified ? 'Verified' : 'Unverified'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(user.totalVolume)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Platform Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(user.totalPlatformFees)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.transactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Payment Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.paymentLinks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-600">Email</Label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <Label className="text-slate-600">Phone</Label>
                <p className="font-medium">{user.phone || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-slate-600">bKash Number</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.bkashNumber || 'Not set'}</p>
                  {!user.bkashVerified && user.bkashNumber && (
                    <Button size="sm" variant="ghost" onClick={() => setShowVerifyBkash(true)}>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-slate-600">Bank Verified</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.bankVerified ? 'Yes' : 'No'}</p>
                  {!user.bankVerified && (
                    <Button size="sm" variant="ghost" onClick={() => setShowVerifyBank(true)}>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-slate-600">Member Since</Label>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <Label className="text-slate-600">Plan</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.plan}</p>
                  <Button size="sm" variant="ghost" onClick={() => setShowChangePlan(true)}>
                    Change
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payment Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Recent Payment Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.paymentLinks.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No payment links yet</p>
            ) : (
              <div className="space-y-3">
                {user.paymentLinks.slice(0, 5).map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(link.amount)}</p>
                      <p className="text-sm text-slate-500 truncate max-w-[200px]">{link.description}</p>
                    </div>
                    <Badge variant={link.status === 'PAID' ? 'default' : 'secondary'}>
                      {link.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {user.transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(tx.amount)}</p>
                      <p className="text-sm text-slate-500">{formatDate(tx.createdAt)}</p>
                    </div>
                    <Badge variant={tx.status === 'SUCCESS' ? 'default' : 'secondary'}>
                      {tx.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payouts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.payouts.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No payouts yet</p>
            ) : (
              <div className="space-y-3">
                {user.payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(payout.amount)}</p>
                      <p className="text-sm text-slate-500">{payout.method}</p>
                    </div>
                    <Badge variant={payout.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {showVerifyBkash && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verify bKash</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Mark bKash number {user.bkashNumber} as verified?
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowVerifyBkash(false)}>Cancel</Button>
                <Button onClick={verifyBkash}>Verify</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showVerifyBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verify Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Mark bank account as verified?
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowVerifyBank(false)}>Cancel</Button>
                <Button onClick={verifyBank}>Verify</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showChangePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Change Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Plan</Label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as 'FREE' | 'PREMIUM')}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="FREE">Free</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowChangePlan(false)}>Cancel</Button>
                <Button onClick={changePlan}>Update Plan</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
