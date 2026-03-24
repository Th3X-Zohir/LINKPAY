'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FileDisputeDialogProps {
  transactionId: string
  transactionAmount: number
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const disputeReasons = [
  { value: 'CLIENT_NOT_PAID', label: 'Client Not Paid' },
  { value: 'SERVICE_NOT_DELIVERED', label: 'Service Not Delivered' },
  { value: 'OVERCHARGED', label: 'Overcharged' },
  { value: 'DUPLICATE_CHARGE', label: 'Duplicate Charge' },
  { value: 'UNAUTHORIZED_CHARGE', label: 'Unauthorized Charge' },
  { value: 'OTHER', label: 'Other' },
]

export function FileDisputeDialog({
  transactionId,
  transactionAmount,
  trigger,
  onSuccess,
}: FileDisputeDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      toast.error('Please select a reason')
      return
    }

    if (description.length < 20) {
      toast.error('Description must be at least 20 characters')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          reason,
          description,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Dispute filed successfully')
        setOpen(false)
        setReason('')
        setDescription('')
        onSuccess?.()
      } else {
        toast.error(data.error || 'Failed to file dispute')
      }
    } catch (error) {
      toast.error('Failed to file dispute')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <AlertTriangle className="w-4 h-4 mr-1" />
            File Dispute
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              File a Dispute
            </DialogTitle>
            <DialogDescription>
              Report an issue with this transaction of BDT {transactionAmount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-red-500">*</span>
              </label>
              <Select
                id="reason"
                options={disputeReasons}
                placeholder="Select a reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                className={cn(
                  'flex min-h-[120px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                )}
                placeholder="Please describe the issue in detail (at least 20 characters)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={20}
                maxLength={1000}
              />
              <p className="text-xs text-slate-500 text-right">
                {description.length}/1000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Dispute'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}