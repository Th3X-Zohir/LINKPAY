'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, CreditCard, Link as LinkIcon, DollarSign, Percent, BarChart3 } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface AnalyticsData {
  overview: {
    totalEarnings: number
    totalVolume: number
    totalFees: number
    transactionCount: number
    paymentLinksCount: number
    successRate: number
  }
  dailyEarnings: { date: string; earnings: number }[]
  dailyTransactions: { date: string; count: number }[]
  topTransactions: {
    id: string
    amount: number
    netAmount: number
    platformFee: number
    gatewayFee: number
    createdAt: string
    description: string
  }[]
  feeBreakdown: {
    platformFee: number
    gatewayFee: number
  }
}

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/users/me/analytics')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600">Track your earnings and performance</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.overview || {
    totalEarnings: 0,
    totalVolume: 0,
    totalFees: 0,
    transactionCount: 0,
    paymentLinksCount: 0,
    successRate: 0
  }

  const chartData = data?.dailyEarnings || []
  const transactionChartData = data?.dailyTransactions || []

  const pieData = data?.feeBreakdown ? [
    { name: 'Platform Fee (0.75%)', value: data.feeBreakdown.platformFee },
    { name: 'Gateway Fee (2.55%)', value: data.feeBreakdown.gatewayFee },
    { name: 'You Receive', value: stats.totalVolume - data.feeBreakdown.platformFee - data.feeBreakdown.gatewayFee }
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600">Track your earnings and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</div>
            <p className="text-xs text-green-600/70">Net earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Volume</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
            <p className="text-xs text-slate-500">{stats.transactionCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Payment Links</CardTitle>
            <LinkIcon className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paymentLinksCount}</div>
            <p className="text-xs text-slate-500">Created links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
            <Percent className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-slate-500">Payment completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Earnings Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No earnings data yet</p>
                  <p className="text-sm">Create payment links to see your earnings chart</p>
                </div>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `৳${(value / 100).toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0) as string, 'Earnings']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#16a34a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No data yet</p>
                </div>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value) || 0) as string}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Volume</span>
                <span className="font-semibold">{formatCurrency(stats.totalVolume)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Platform Fee (0.75%)</span>
                <span className="font-semibold text-red-600">-{formatCurrency(data?.feeBreakdown?.platformFee || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Gateway Fee (2.55%)</span>
                <span className="font-semibold text-red-600">-{formatCurrency(data?.feeBreakdown?.gatewayFee || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t pt-2 font-semibold">
                <span>You Receive</span>
                <span className="text-green-600">{formatCurrency(stats.totalEarnings)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Volume Chart */}
      {transactionChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [`${value || 0} transactions`]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.topTransactions || data.topTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Create payment links to start accepting payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topTransactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{formatCurrency(tx.amount)}</p>
                    <p className="text-sm text-slate-500 truncate max-w-md">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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