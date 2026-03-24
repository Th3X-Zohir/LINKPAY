'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceActionsProps {
  transactionId: string
  customerEmail: string
}

export function InvoiceActions({ transactionId, customerEmail }: InvoiceActionsProps) {
  const [loading, setLoading] = useState<'download' | 'email' | null>(null)

  const handleDownload = async () => {
    setLoading('download')
    try {
      const response = await fetch(`/api/invoices/${transactionId}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate invoice')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${transactionId.substring(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Invoice downloaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice')
    } finally {
      setLoading(null)
    }
  }

  const handleEmail = async () => {
    setLoading('email')
    try {
      const response = await fetch(`/api/invoices/${transactionId}/email`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice')
      }
      
      toast.success(data.message || 'Invoice sent successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invoice')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={loading !== null}
      >
        {loading === 'download' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEmail}
        disabled={loading !== null}
        title={`Send to ${customerEmail}`}
      >
        {loading === 'email' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}
