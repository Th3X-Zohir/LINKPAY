'use client'

import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, User, DollarSign, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Dispute {
  id: string
  transactionId: string
  userId: string
  reason: string
  description: string
  status: string
  amount: number
  evidenceUrls: string[]
  adminNotes: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
}

const disputeReasonLabels: Record<string, string> = {
  CLIENT_NOT_PAID: 'Client Not Paid',
  SERVICE_NOT_DELIVERED: 'Service Not Delivered',
  OVERCHARGED: 'Overcharged',
  DUPLICATE_CHARGE: 'Duplicate Charge',
  UNAUTHORIZED_CHARGE: 'Unauthorized Charge',
  OTHER: 'Other'
}

const disputeStatusColors: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: 'bg-amber-100', text: 'text-amber-800' },
  UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-800' },
  RESOLVED: { bg: 'bg-green-100', text: 'text-green-800' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [resolution, setResolution] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/admin/disputes')
      const data = await res.json()
      if (data.success) {
        setDisputes(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch disputes')
    } finally {
      setLoading(false)
    }
  }

  const updateDisputeStatus = async (disputeId: string, status: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes, resolution })
      })
      const data = await res.json()
      if (data.success) {
        await fetchDisputes()
        setSelectedDispute(null)
        setAdminNotes('')
        setResolution('')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to update dispute')
    } finally {
      setUpdating(false)
    }
  }

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch =
      dispute.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || dispute.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispute Management</h1>
          <p className="text-slate-600">Review and manage payment disputes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            {disputes.filter(d => d.status === 'OPEN').length} Open
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {disputes.filter(d => d.status === 'UNDER_REVIEW').length} Under Review
          </Badge>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by user email, name, or dispute ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Disputes</CardTitle>
          <CardDescription>
            {filteredDisputes.length} dispute{filteredDisputes.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No disputes found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDisputes.map(dispute => (
                <div
                  key={dispute.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDispute(dispute)
                    setAdminNotes(dispute.adminNotes || '')
                    setResolution(dispute.resolution || '')
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${disputeStatusColors[dispute.status]?.bg}`}>
                    {dispute.status === 'OPEN' && <Clock className={`w-5 h-5 ${disputeStatusColors[dispute.status]?.text}`} />}
                    {dispute.status === 'UNDER_REVIEW' && <AlertCircle className={`w-5 h-5 ${disputeStatusColors[dispute.status]?.text}`} />}
                    {dispute.status === 'RESOLVED' && <CheckCircle className={`w-5 h-5 ${disputeStatusColors[dispute.status]?.text}`} />}
                    {dispute.status === 'REJECTED' && <XCircle className={`w-5 h-5 ${disputeStatusColors[dispute.status]?.text}`} />}
                    {dispute.status === 'CLOSED' && <CheckCircle className={`w-5 h-5 ${disputeStatusColors[dispute.status]?.text}`} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {disputeReasonLabels[dispute.reason] || dispute.reason}
                      </p>
                      <Badge className={`${disputeStatusColors[dispute.status]?.bg} ${disputeStatusColors[dispute.status]?.text}`}>
                        {dispute.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {dispute.user.name || dispute.user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(dispute.amount)}
                      </span>
                      <span>{formatDate(dispute.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Dispute Review</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDispute(null)}
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Dispute ID</p>
                  <p className="font-mono text-sm">{selectedDispute.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={`${disputeStatusColors[selectedDispute.status]?.bg} ${disputeStatusColors[selectedDispute.status]?.text}`}>
                    {selectedDispute.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-medium">{selectedDispute.user.name || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{selectedDispute.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Reason</p>
                  <p className="font-medium">{disputeReasonLabels[selectedDispute.reason] || selectedDispute.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedDispute.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium">{formatDate(selectedDispute.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Description</p>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedDispute.description}</p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Admin Actions</h3>

                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this dispute..."
                    className="w-full h-24 rounded-md border border-input bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution Notes</Label>
                  <textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe how this dispute was resolved..."
                    className="w-full h-24 rounded-md border border-input bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => updateDisputeStatus(selectedDispute.id, 'UNDER_REVIEW')}
                    disabled={updating || selectedDispute.status !== 'OPEN'}
                    variant="outline"
                  >
                    Mark Under Review
                  </Button>
                  <Button
                    onClick={() => updateDisputeStatus(selectedDispute.id, 'RESOLVED')}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Resolve
                  </Button>
                  <Button
                    onClick={() => updateDisputeStatus(selectedDispute.id, 'REJECTED')}
                    disabled={updating}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => updateDisputeStatus(selectedDispute.id, 'CLOSED')}
                    disabled={updating}
                    variant="secondary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}