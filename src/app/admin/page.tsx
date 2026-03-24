'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Link as LinkIcon, CreditCard, Wallet, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface DashboardStats {
  overview: {
    totalUsers: number
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    pendingPayoutsCount: number
    totalPayouts: number
  }
  volume: {
    totalVolume: number
    totalNetAmount: number
    platformRevenue: number
    pendingPayoutsAmount: number
  }
  recentTransactions: Array<{
    id: string
    amount: number
    status: string
    user: { name: string | null; email: string }
    paymentLink: { description: string }
  }>
  recentUsers: Array<{
    id: string
    name: string | null
    email: string
    plan: string
    createdAt: string
    _count: { transactions: number }
  }>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics/dashboard')
      const result = await res.json()
      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Platform overview and management</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overview.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Payment Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overview.totalPayouts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overview.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.overview.pendingPayoutsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              Platform Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.volume.platformRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Volume Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Total Platform Volume</h3>
              <p className="text-sm text-green-700">All successful transactions</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.volume.totalVolume)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/admin/transactions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{tx.paymentLink.description}</p>
                      <p className="text-xs text-slate-500">{tx.user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(tx.amount)}</p>
                      <Badge
                        className={
                          tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                          tx.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Users</CardTitle>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentUsers.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No users yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{user.name || 'No name'}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <Badge variant={user.plan === 'PREMIUM' ? 'default' : 'outline'}>
                        {user.plan}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {user._count.transactions} txns
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
