'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Clock, Trash2, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface Document {
  id: string
  type: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  verified: boolean
  verifiedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

const documentTypeLabels: Record<string, string> = {
  CONTRACT: 'Contract',
  DELIVERY_PROOF: 'Delivery Proof',
  ID_PROOF: 'ID Proof',
  TAX_DOCUMENT: 'Tax Document',
  BUSINESS_LICENSE: 'Business License',
  OTHER: 'Other'
}

const documentTypeColors: Record<string, string> = {
  CONTRACT: 'bg-blue-100 text-blue-800',
  DELIVERY_PROOF: 'bg-green-100 text-green-800',
  ID_PROOF: 'bg-purple-100 text-purple-800',
  TAX_DOCUMENT: 'bg-orange-100 text-orange-800',
  BUSINESS_LICENSE: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/users/documents')
      const data = await res.json()
      if (data.success) {
        setDocuments(data.data)
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedType) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', selectedType)

    try {
      const res = await fetch('/api/users/documents', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        setDocuments([data.data, ...documents])
        setSelectedType('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await fetch(`/api/users/documents/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        setDocuments(documents.filter(doc => doc.id !== id))
      }
    } catch (err) {
      setError('Failed to delete document')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Evidence Vault</h1>
        <p className="text-slate-600">Upload and manage your proof documents for compliance</p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Upload contracts, delivery proofs, ID documents, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type</Label>
              <Select
                id="doc-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                placeholder="Select type"
                options={[
                  { value: 'CONTRACT', label: 'Contract' },
                  { value: 'DELIVERY_PROOF', label: 'Delivery Proof' },
                  { value: 'ID_PROOF', label: 'ID Proof' },
                  { value: 'TAX_DOCUMENT', label: 'Tax Document' },
                  { value: 'BUSINESS_LICENSE', label: 'Business License' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                onChange={handleUpload}
                disabled={!selectedType || uploading}
                aria-required="true"
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertCircle className="w-4 h-4" />
            Max file size: 10MB. Allowed: JPEG, PNG, GIF, PDF, DOC, DOCX
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Documents
          </CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
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
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 truncate">
                        {doc.originalName}
                      </p>
                      <Badge className={documentTypeColors[doc.type]}>
                        {documentTypeLabels[doc.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>-</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString('en-BD')}</span>
                      <span>-</span>
                      {doc.verified ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : doc.rejectionReason ? (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>
                    {doc.rejectionReason && (
                      <p className="text-sm text-red-600 mt-1">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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