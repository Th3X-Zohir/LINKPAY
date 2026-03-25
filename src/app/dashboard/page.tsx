'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardStatsSkeleton, TransactionRowSkeleton } from '@/components/ui/skeleton'
import { Plus, Link as LinkIcon, CreditCard, TrendingUp, ArrowRight, Wallet, ArrowUpRight, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DashboardData {
  overview: {
    totalEarnings: number
    totalVolume: number
    totalFees: number
    transactionCount: number
    paymentLinksCount: number
    successRate: number
  }
  recentTransactions: Array<{
    id: string
    amount: number
    netAmount: number
    platformFee: number
    gatewayFee: number
    createdAt: string
    paymentLink: {
      description: string
    }
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/me/analytics')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <DashboardStatsSkeleton />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error || 'Failed to load dashboard'}</AlertDescription>
            </Alert>
            <Button onClick={fetchDashboard} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = data

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-0.5">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Create Payment Link
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Earnings Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-green-700">Total Earnings</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(stats.overview.totalEarnings)}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stats.overview.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        {/* Payment Links Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-blue-700">Payment Links</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">{stats.overview.paymentLinksCount}</div>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Active links
            </p>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-purple-700">Total Volume</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(stats.overview.totalVolume)}</div>
            <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {stats.overview.successRate}% success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
          <Link href="/dashboard/transactions" className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {!stats.recentTransactions || stats.recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">No transactions yet</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm mb-4">
                Create your first payment link and share it with your clients to start receiving payments.
              </p>
              <Link href="/dashboard/links/new">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Create Payment Link
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{tx.paymentLink.description}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('en-BD', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+{formatCurrency(tx.netAmount)}</p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(tx.amount)} total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}