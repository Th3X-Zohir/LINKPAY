'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'
import { User, Wallet, Building, Save, CheckCircle, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileLoading, setProfileLoading] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bkashNumber: '',
    bankAccount: '',
    bankName: '',
    bankRouting: ''
  })

  const fetchProfile = useCallback(async () => {
    setProfileLoaded(false)
    try {
      const res = await fetch('/api/users/profile')
      const data = await res.json()
      if (res.ok && data.data) {
        setFormData({
          name: data.data.name || session?.user?.name || '',
          phone: data.data.phone || '',
          bkashNumber: data.data.bkashNumber || '',
          bankAccount: data.data.bankAccount || '',
          bankName: data.data.bankName || '',
          bankRouting: data.data.bankRouting || ''
        })
      } else if (session?.user?.name) {
        // Fallback to session name if API doesn't return name
        setFormData(prev => ({ ...prev, name: session?.user?.name || '' }))
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setProfileLoaded(true)
    }
  }, [session?.user?.name])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handlePayoutMethodsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutLoading(true)
    setProfileLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/users/payout-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bkashNumber: formData.bkashNumber,
          bankAccount: formData.bankAccount,
          bankName: formData.bankName,
          bankRouting: formData.bankRouting
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update payout methods')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPayoutLoading(false)
      setProfileLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setPayoutLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setProfileLoading(false)
      setPayoutLoading(false)
    }
  }

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // If not authenticated, don't render anything (will redirect)
  if (!session) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and payout information</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!profileLoaded ? (
        <Card>
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : (
        <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Profile Information
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={session?.user?.email || ''}
              disabled
              aria-disabled="true"
              className="bg-slate-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Payout Information
          </CardTitle>
          <CardDescription>Where your earnings will be sent</CardDescription>
        </CardHeader>
        <form onSubmit={handlePayoutMethodsSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bkashNumber">bKash Number</Label>
              <Input
                id="bkashNumber"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={formData.bkashNumber}
                onChange={(e) => setFormData({ ...formData, bkashNumber: e.target.value })}
              />
              <p className="text-sm text-slate-500">Primary payout method. Min withdrawal: ৳5.00</p>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Building className="w-4 h-4" /> Bank Account (Optional)
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="e.g., Dhaka Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <Input
                    id="bankAccount"
                    type="text"
                    placeholder="Account number"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankRouting">Routing Number</Label>
                  <Input
                    id="bankRouting"
                    type="text"
                    placeholder="Routing number"
                    value={formData.bankRouting}
                    onChange={(e) => setFormData({ ...formData, bankRouting: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={payoutLoading || profileLoading} className="gap-2">
                <Save className="w-4 h-4" />
                {payoutLoading ? 'Processing...' : 'Save Payout Methods'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={payoutLoading || profileLoading} className="gap-2">
          <Save className="w-4 h-4" />
          {profileLoading ? 'Processing...' : 'Save Changes'}
        </Button>
      </div>
      </>
      )}
    </div>
  )
}
