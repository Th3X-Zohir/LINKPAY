'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Loader2,
  Crown,
  MoreHorizontal,
  Eye,
  Phone,
  Calendar,
  CreditCard,
  Link2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600">Manage all platform users ({total} total)</p>
        </div>
        <Button variant="outline" onClick={fetchUsers} className="gap-2">
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email, name, or phone..."
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.plan === 'PREMIUM').length}</p>
                <p className="text-sm text-slate-500">Premium Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-slate-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Link2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.reduce((sum, u) => sum + u.paymentLinksCount, 0)}</p>
                <p className="text-sm text-slate-500">Active Links</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
            <div className="text-center py-12 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
              {search && <p className="text-sm">Try adjusting your search</p>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b bg-slate-50/50">
                      <th className="pb-3 font-medium px-6">User</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Contact</th>
                      <th className="pb-3 font-medium">Stats</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge
                            variant={user.plan === 'PREMIUM' ? 'default' : 'secondary'}
                            className={user.plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1' : ''}
                          >
                            {user.plan === 'PREMIUM' && <Crown className="w-3 h-3" />}
                            {user.plan}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {user.phone || '-'}
                            </p>
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              {user.bkashNumber || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-4">
                            <div className="text-center">
                              <p className="font-semibold text-slate-900">{user.paymentLinksCount}</p>
                              <p className="text-xs text-slate-500">Links</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-slate-900">{user.transactionsCount}</p>
                              <p className="text-xs text-slate-500">Txns</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/users/${user.id}`}>
                              <Button size="sm" variant="ghost" className="gap-1">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.plan === 'FREE' ? (
                                  <DropdownMenuItem onClick={() => updateUserPlan(user.id, 'PREMIUM')} className="gap-2">
                                    <UserCheck className="w-4 h-4 text-green-600" />
                                    Upgrade to Premium
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => updateUserPlan(user.id, 'FREE')} className="gap-2">
                                    <UserX className="w-4 h-4 text-amber-600" />
                                    Downgrade to Free
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-slate-500">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center px-3 text-sm">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
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