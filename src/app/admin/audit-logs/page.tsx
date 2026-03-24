'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  User,
  CreditCard,
  Link as LinkIcon,
  Wallet,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
}

interface ActionType {
  action: string
  count: number
}

const actionIcons: Record<string, React.ElementType> = {
  USER_CREATED: User,
  USER_LOGIN: User,
  USER_LOGOUT: User,
  USER_PROFILE_UPDATED: User,
  USER_PASSWORD_CHANGED: User,
  USER_PAYOUT_METHOD_UPDATED: User,
  PAYMENT_LINK_CREATED: LinkIcon,
  PAYMENT_LINK_UPDATED: LinkIcon,
  PAYMENT_LINK_CANCELLED: LinkIcon,
  PAYMENT_LINK_DELETED: LinkIcon,
  PAYMENT_LINK_SHARED: LinkIcon,
  TRANSACTION_CREATED: CreditCard,
  TRANSACTION_SUCCESS: CheckCircle,
  TRANSACTION_FAILED: XCircle,
  TRANSACTION_REFUNDED: CreditCard,
  PAYOUT_REQUESTED: Wallet,
  PAYOUT_APPROVED: CheckCircle,
  PAYOUT_REJECTED: XCircle,
  PAYOUT_INITIATED: Wallet,
  PAYOUT_COMPLETED: CheckCircle,
  PAYOUT_FAILED: XCircle,
  PAYOUT_CANCELLED: AlertCircle,
  ADMIN_USER_SUSPENDED: Shield,
  ADMIN_USER_UNSUSPENDED: Shield,
  ADMIN_PLAN_CHANGED: Shield,
  ADMIN_SETTINGS_CHANGED: Shield
}

const actionColors: Record<string, string> = {
  USER_CREATED: 'bg-blue-100 text-blue-700',
  USER_LOGIN: 'bg-slate-100 text-slate-700',
  USER_LOGOUT: 'bg-slate-100 text-slate-700',
  USER_PROFILE_UPDATED: 'bg-blue-100 text-blue-700',
  USER_PASSWORD_CHANGED: 'bg-orange-100 text-orange-700',
  USER_PAYOUT_METHOD_UPDATED: 'bg-purple-100 text-purple-700',
  PAYMENT_LINK_CREATED: 'bg-green-100 text-green-700',
  PAYMENT_LINK_UPDATED: 'bg-blue-100 text-blue-700',
  PAYMENT_LINK_CANCELLED: 'bg-orange-100 text-orange-700',
  PAYMENT_LINK_DELETED: 'bg-red-100 text-red-700',
  PAYMENT_LINK_SHARED: 'bg-green-100 text-green-700',
  TRANSACTION_CREATED: 'bg-slate-100 text-slate-700',
  TRANSACTION_SUCCESS: 'bg-green-100 text-green-700',
  TRANSACTION_FAILED: 'bg-red-100 text-red-700',
  TRANSACTION_REFUNDED: 'bg-orange-100 text-orange-700',
  PAYOUT_REQUESTED: 'bg-purple-100 text-purple-700',
  PAYOUT_APPROVED: 'bg-green-100 text-green-700',
  PAYOUT_REJECTED: 'bg-red-100 text-red-700',
  PAYOUT_INITIATED: 'bg-blue-100 text-blue-700',
  PAYOUT_COMPLETED: 'bg-green-100 text-green-700',
  PAYOUT_FAILED: 'bg-red-100 text-red-700',
  PAYOUT_CANCELLED: 'bg-orange-100 text-orange-700',
  ADMIN_USER_SUSPENDED: 'bg-red-100 text-red-700',
  ADMIN_USER_UNSUSPENDED: 'bg-green-100 text-green-700',
  ADMIN_PLAN_CHANGED: 'bg-purple-100 text-purple-700',
  ADMIN_SETTINGS_CHANGED: 'bg-slate-100 text-slate-700'
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [actionTypes, setActionTypes] = useState<ActionType[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action, userId])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(action && { action }),
        ...(userId && { userId })
      })

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.data)
        setActionTypes(data.actionTypes || [])
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  function getActionIcon(action: string) {
    const Icon = actionIcons[action] || Clock
    return <Icon className="w-4 h-4" />
  }

  function getActionColor(action: string) {
    return actionColors[action] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-600">Track all platform activities ({total} total)</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">All Actions</option>
                {actionTypes.map((at) => (
                  <option key={at.action} value={at.action}>
                    {at.action.replace(/_/g, ' ')} ({at.count})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[200px]">
              <Input
                placeholder="Filter by user ID..."
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value)
                  setPage(1)
                }}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Action</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="font-medium">{formatDate(log.createdAt)}</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getActionColor(log.action)}>
                          <span className="flex items-center gap-1">
                            {getActionIcon(log.action)}
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {log.user ? (
                          <div className="text-sm">
                            <p className="font-medium">{log.user.name || 'Unknown'}</p>
                            <p className="text-slate-500 text-xs">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">System</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.details ? (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                              View details
                            </summary>
                            <pre className="mt-1 p-2 bg-slate-100 rounded text-xs overflow-x-auto max-w-[300px]">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
