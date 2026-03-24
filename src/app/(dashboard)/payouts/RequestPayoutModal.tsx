'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Wallet, AlertCircle } from 'lucide-react'

interface RequestPayoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableBalance: number
  userBkashNumber?: string | null
  userBankAccount?: string | null
  onSuccess?: () => void
}

const MIN_PAYOUT = 50000 // 500 BDT in poisha
const MAX_PAYOUT = 5000000 // 50000 BDT in poisha
const BKASH_FEE_PERCENT = 0.01

export function RequestPayoutModal({
  open,
  onOpenChange,
  availableBalance,
  userBkashNumber,
  userBankAccount,
  onSuccess
}: RequestPayoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<'BKASH' | 'BANK'>('BKASH')
  const [error, setError] = useState('')

  // Calculate fees and net amount
  const bKashFee = Math.round(amount * BKASH_FEE_PERCENT)
  const netAmount = amount - bKashFee

  useEffect(() => {
    if (!open) {
      setAmount(0)
      setMethod('BKASH')
      setError('')
    }
  }, [open])

  const validateAmount = (value: number): string | null => {
    if (value < MIN_PAYOUT) {
      return `Minimum payout is ৳500`
    }
    if (value > MAX_PAYOUT) {
      return `Maximum payout is ৳50,000`
    }
    if (value > availableBalance) {
      return `Insufficient balance. You only have ৳${(availableBalance / 100).toLocaleString('bn-BD')} available`
    }
    return null
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setAmount(value)
    setError(validateAmount(value) || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateAmount(amount)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.error || 'Failed to request payout')
      }

      toast.success('Payout requested', {
        description: 'Your payout request has been submitted for approval'
      })

      setAmount(0)
      setMethod('BKASH')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Failed to request payout'
      })
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    amount >= MIN_PAYOUT &&
    amount <= MAX_PAYOUT &&
    amount <= availableBalance &&
    (method === 'BKASH' ? !!userBkashNumber : !!userBankAccount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Withdraw your earnings to your bKash or bank account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Available Balance Display */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">Available Balance</p>
            <p className="text-xl font-bold text-green-600">
              ৳{(availableBalance / 100).toLocaleString('bn-BD')}
            </p>
          </div>

          {/* Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="method">Payout Method</Label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as 'BKASH' | 'BANK')}
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
            >
              <option value="BKASH" disabled={!userBkashNumber}>
                bKash {userBkashNumber ? `(${userBkashNumber})` : '(Not configured)'}
              </option>
              <option value="BANK" disabled={!userBankAccount}>
                Bank Transfer {userBankAccount ? `(${userBankAccount.slice(-4)}...)` : '(Not configured)'}
              </option>
            </select>
            {method === 'BKASH' && !userBkashNumber && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please add your bKash number in settings first
              </p>
            )}
            {method === 'BANK' && !userBankAccount && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please add your bank details in settings first
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (৳)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount || ''}
              onChange={handleAmountChange}
              className="text-lg"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-xs text-slate-500">
              Minimum: ৳500 - Maximum: ৳50,000
            </p>
          </div>

          {/* Fee Breakdown */}
          {amount > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount</span>
                <span>৳{(amount / 100).toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">bKash Fee (1%)</span>
                <span className="text-red-500">-৳{(bKashFee / 100).toLocaleString('bn-BD')}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>You will receive</span>
                <span className="text-green-600">৳{(netAmount / 100).toLocaleString('bn-BD')}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Request Payout'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
