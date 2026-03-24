'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight, UserCheck, UserX, Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  plan: 'FREE' | 'PREMIUM'
  bkashNumber: string | null
  createdAt: string
  paymentLinksCount: number
  transactionsCount: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()

      if (data.success) {
        setUsers(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        setError(data.error?.message || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  async function updateUserPlan(userId: string, plan: 'FREE' | 'PREMIUM') {
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, plan } : u))
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600">Manage all platform users ({total} total)</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchUsers}>Retry</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">bKash</th>
                      <th className="pb-3 font-medium">Links</th>
                      <th className="pb-3 font-medium">Txns</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="text-sm">
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{user.name || 'No name'}</p>
                            <p className="text-slate-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={user.plan === 'PREMIUM' ? 'default' : 'outline'}>
                            {user.plan}
                          </Badge>
                        </td>
                        <td className="py-4 text-slate-600">
                          {user.bkashNumber || '-'}
                        </td>
                        <td className="py-4">
                          {user.paymentLinksCount}
                        </td>
                        <td className="py-4">
                          {user.transactionsCount}
                        </td>
                        <td className="py-4 text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            {user.plan === 'FREE' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserPlan(user.id, 'PREMIUM')}
                                className="gap-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                Upgrade
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserPlan(user.id, 'FREE')}
                                className="gap-1"
                              >
                                <UserX className="w-3 h-3" />
                                Downgrade
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-slate-500">
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
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}