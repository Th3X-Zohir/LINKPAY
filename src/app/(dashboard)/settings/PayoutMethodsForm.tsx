'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Phone, Building } from 'lucide-react'

interface PayoutMethodsFormProps {
  currentBkash: string | null
  currentBank: string | null
  bankName: string | null
  bankRouting: string | null
  bkashVerified: boolean
  bankVerified: boolean
}

export function PayoutMethodsForm({
  currentBkash,
  currentBank,
  bankName,
  bankRouting,
  bkashVerified,
  bankVerified
}: PayoutMethodsFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    bkashNumber: '',
    bankAccount: '',
    bankName: '',
    bankRouting: ''
  })

  const handleSubmit = async (e: React.FormEvent, method: 'bkash' | 'bank') => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = method === 'bkash'
        ? { bkashNumber: formData.bkashNumber }
        : { bankAccount: formData.bankAccount, bankName: formData.bankName, bankRouting: formData.bankRouting }

      const res = await fetch('/api/users/payout-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Failed to update ${method} details`)
      }

      setSuccess(`${method === 'bkash' ? 'bKash' : 'Bank'} details updated successfully!`)
      setFormData({ bkashNumber: '', bankAccount: '', bankName: '', bankRouting: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const validateBkash = (number: string): boolean => {
    return /^01[3-9]\d{8}$/.test(number)
  }

  const validateBankAccount = (account: string): boolean => {
    return account.length >= 10 && account.length <= 18
  }

  return (
    <div className="space-y-6">
      {/* bKash Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-pink-600" />
            <span className="font-medium">bKash</span>
          </div>
          {bkashVerified ? (
            <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500 gap-1">
              <XCircle className="w-3 h-3" /> Not Verified
            </Badge>
          )}
        </div>

        {currentBkash ? (
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Current Number</p>
              <p className="font-medium">{currentBkash}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No bKash number added yet</p>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'bkash')} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="bkashNumber">Add/Update bKash Number</Label>
            <Input
              id="bkashNumber"
              type="tel"
              value={formData.bkashNumber}
              onChange={(e) => setFormData({ ...formData, bkashNumber: e.target.value })}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              aria-describedby={formData.bkashNumber && !validateBkash(formData.bkashNumber) ? 'bkash-number-error' : undefined}
            />
            {formData.bkashNumber && !validateBkash(formData.bkashNumber) && (
              <p id="bkash-number-error" className="text-xs text-red-500">Invalid bKash number format (01XXXXXXXXX)</p>
            )}
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={loading || !formData.bkashNumber || !validateBkash(formData.bkashNumber)}
          >
            {loading ? 'Updating...' : 'Update bKash'}
          </Button>
        </form>
      </div>

      <div className="border-t" />

      {/* Bank Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Bank Account</span>
          </div>
          {bankVerified ? (
            <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500 gap-1">
              <XCircle className="w-3 h-3" /> Not Verified
            </Badge>
          )}
        </div>

        {currentBank ? (
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Account</span>
              <span className="font-medium">{currentBank}</span>
            </div>
            {bankName && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Bank</span>
                <span className="font-medium">{bankName}</span>
              </div>
            )}
            {bankRouting && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Routing</span>
                <span className="font-medium">{bankRouting}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No bank account added yet</p>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'bank')} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Account Number</Label>
            <Input
              id="bankAccount"
              type="text"
              value={formData.bankAccount}
              onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
              placeholder="Account number"
            />
            {formData.bankAccount && !validateBankAccount(formData.bankAccount) && (
              <p className="text-xs text-red-500">Account number should be 10-18 digits</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="e.g., Dhaka Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankRouting">Routing Number</Label>
            <Input
              id="bankRouting"
              type="text"
              value={formData.bankRouting}
              onChange={(e) => setFormData({ ...formData, bankRouting: e.target.value })}
              placeholder="6-digit routing number"
              maxLength={6}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={loading || !formData.bankAccount || !validateBankAccount(formData.bankAccount)}
          >
            {loading ? 'Updating...' : 'Update Bank Details'}
          </Button>
        </form>
      </div>

      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
