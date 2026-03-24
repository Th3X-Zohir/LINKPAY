'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Users, CreditCard, Wallet, Link as LinkIcon, Loader2 } from 'lucide-react'

interface AnalyticsData {
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
  trends: {
    recentSignups: number
    signupTrend: number
    recentTransactions: number
    transactionTrend: number
  }
  distribution: {
    plans: Record<string, number>
    transactionStatuses: Record<string, number>
    payoutStatuses: Record<string, number>
  }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics/dashboard')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Failed to fetch analytics')
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

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">{error || 'Failed to load analytics'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-slate-600">Real-time platform metrics and statistics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">
              +{data.trends.recentSignups} this week
              {data.trends.signupTrend > 0 ? (
                <span className="text-green-600 ml-1">↑{data.trends.signupTrend}%</span>
              ) : data.trends.signupTrend < 0 ? (
                <span className="text-red-600 ml-1">↓{Math.abs(data.trends.signupTrend)}%</span>
              ) : null}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.totalTransactions}</div>
            <p className="text-xs text-slate-500 mt-1">
              {data.overview.successfulTransactions} successful
              {data.trends.transactionTrend > 0 ? (
                <span className="text-green-600 ml-1">↑{data.trends.transactionTrend}%</span>
              ) : data.trends.transactionTrend < 0 ? (
                <span className="text-red-600 ml-1">↓{Math.abs(data.trends.transactionTrend)}%</span>
              ) : null}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Payment Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.distribution.plans.FREE || 0) + (data.distribution.plans.PREMIUM || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Platform Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(data.volume.platformRevenue)}</div>
            <p className="text-xs text-slate-500 mt-1">From 0.75% platform fee</p>
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
              <div className="text-3xl font-bold text-green-600">{formatCurrency(data.volume.totalVolume)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">FREE</Badge>
                  <span className="text-sm text-slate-600">Free Users</span>
                </div>
                <span className="font-bold">{data.distribution.plans.FREE || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>PREMIUM</Badge>
                  <span className="text-sm text-slate-600">Premium Users</span>
                </div>
                <span className="font-bold">{data.distribution.plans.PREMIUM || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Success</span>
                <Badge className="bg-green-100 text-green-700">{data.distribution.transactionStatuses.SUCCESS || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Failed</span>
                <Badge className="bg-red-100 text-red-700">{data.distribution.transactionStatuses.FAILED || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending</span>
                <Badge className="bg-yellow-100 text-yellow-700">{data.distribution.transactionStatuses.PENDING || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Refunded</span>
                <Badge className="bg-slate-100 text-slate-700">{data.distribution.transactionStatuses.REFUNDED || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payout Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending</span>
                <Badge className="bg-yellow-100 text-yellow-700">{data.distribution.payoutStatuses.PENDING || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Processing</span>
                <Badge className="bg-blue-100 text-blue-700">{data.distribution.payoutStatuses.PROCESSING || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed</span>
                <Badge className="bg-green-100 text-green-700">{data.distribution.payoutStatuses.COMPLETED || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Failed</span>
                <Badge className="bg-red-100 text-red-700">{data.distribution.payoutStatuses.FAILED || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payouts Warning */}
      {data.overview.pendingPayoutsCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900">Pending Payouts</h3>
                <p className="text-sm text-yellow-700">{data.overview.pendingPayoutsCount} payouts awaiting processing</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(data.volume.pendingPayoutsAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
