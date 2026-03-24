'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardStatsSkeleton, TransactionRowSkeleton } from '@/components/ui/skeleton'
import { Plus, Link as LinkIcon, CreditCard, TrendingUp, ArrowRight } from 'lucide-react'
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
            <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
              {error || 'Failed to load dashboard'}
            </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Create Payment Link
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Earnings</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overview.totalEarnings)}</div>
            <p className="text-xs text-slate-500">From {stats.overview.transactionCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Payment Links</CardTitle>
            <LinkIcon className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.paymentLinksCount}</div>
            <p className="text-xs text-slate-500">Created links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Transactions</CardTitle>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.transactionCount}</div>
            <p className="text-xs text-slate-500">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/dashboard/transactions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Create a payment link to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{tx.paymentLink.description}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-BD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+{formatCurrency(tx.netAmount)}</p>
                    <p className="text-xs text-slate-500">
                      Fee: {formatCurrency(tx.platformFee + tx.gatewayFee)}
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