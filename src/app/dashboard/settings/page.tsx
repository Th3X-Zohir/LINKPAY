'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'
import { User, Wallet, Building, Save, Loader2, FileText, ArrowRight, Key, Trash2, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Passkey {
  id: string
  name: string
  deviceType: string | null
  createdAt: string
  lastUsedAt: string | null
}

export default function SettingsPage() {
  const sessionResult = useSession()
  const session = sessionResult?.data
  const status = sessionResult?.status || 'loading'
  const router = useRouter()
  const [profileLoading, setProfileLoading] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [bkashError, setBkashError] = useState('')
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [passkeysLoading, setPasskeysLoading] = useState(true)
  const [registeringPasskey, setRegisteringPasskey] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')
  const [showPasskeyModal, setShowPasskeyModal] = useState(false)
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

  const fetchPasskeys = useCallback(async () => {
    setPasskeysLoading(true)
    try {
      const res = await fetch('/api/users/passkeys')
      const data = await res.json()
      if (data.success) {
        setPasskeys(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch passkeys:', err)
    } finally {
      setPasskeysLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPasskeys()
  }, [fetchPasskeys])

  const handleRegisterPasskey = async () => {
    if (!passkeyName.trim()) {
      toast.error('Please enter a name for this passkey')
      return
    }

    setRegisteringPasskey(true)
    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/passkey/register-options')
      const optionsData = await optionsRes.json()

      if (!optionsData.success) {
        throw new Error(optionsData.error || 'Failed to get registration options')
      }

      const options = optionsData.data

      // Convert base64url challenge to ArrayBuffer
      const challengeBuffer = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0))

      // Convert base64url user ID to ArrayBuffer
      const userIdBuffer = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0))

      // Convert excludeCredentials if present
      const excludeCredentials = options.excludeCredentials?.map((cred: { id: string; type: string; transports?: string[] }) => ({
        ...cred,
        id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
        transports: cred.transports || undefined
      })) || []

      // Create public key options with proper ArrayBuffer types
      const publicKeyOptions = {
        ...options,
        challenge: challengeBuffer,
        user: {
          ...options.user,
          id: userIdBuffer
        },
        excludeCredentials
      }

      // Create a credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      // Convert credential to JSON for API
      const credentialJSON = {
        id: credential.id,
        rawId: Buffer.from(credential.rawId).toString('base64url'),
        type: credential.type,
        response: {
          attestationObject: Buffer.from((credential.response as AuthenticatorAttestationResponse).attestationObject).toString('base64url'),
          clientDataJSON: Buffer.from((credential.response as AuthenticatorAttestationResponse).clientDataJSON).toString('base64url')
        }
      }

      // Verify registration with the server
      const verifyRes = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: credentialJSON,
          challenge: options.challenge,
          name: passkeyName.trim()
        })
      })

      const verifyData = await verifyRes.json()

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Failed to verify passkey')
      }

      toast.success('Passkey registered successfully!')
      setShowPasskeyModal(false)
      setPasskeyName('')
      fetchPasskeys()
    } catch (err) {
      console.error('Passkey registration error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to register passkey')
    } finally {
      setRegisteringPasskey(false)
    }
  }

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm('Are you sure you want to delete this passkey? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/users/passkeys?id=${passkeyId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete passkey')
      }

      toast.success('Passkey deleted successfully')
      fetchPasskeys()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete passkey')
    }
  }

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === 'singleDevice') {
      return <Smartphone className="w-5 h-5 text-blue-600" />
    }
    return <Monitor className="w-5 h-5 text-slate-600" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handlePayoutMethodsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutLoading(true)
    setProfileLoading(true)
    setError('')
    setSuccess(false)
    setBkashError('')

    // Validate bKash number if provided
    if (formData.bkashNumber) {
      const bkashRegex = /^01[3-9]\d{8}$/
      if (!bkashRegex.test(formData.bkashNumber.replace(/\s/g, ''))) {
        setBkashError('Invalid bKash number. Must be 01XXXXXXXXX format.')
        setPayoutLoading(false)
        setProfileLoading(false)
        return
      }
    }

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
        <Alert variant="success">
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
                onChange={(e) => {
                  setFormData({ ...formData, bkashNumber: e.target.value })
                  setBkashError('')
                }}
              />
              {bkashError && (
                <p className="text-sm text-red-600">{bkashError}</p>
              )}
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

      <Link href="/settings/invoice-settings">
        <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Invoice Settings</h3>
                <p className="text-sm text-slate-500">Customize your invoice branding and payment terms</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>
      </Link>

      {/* Passkeys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              <CardTitle>Passkeys</CardTitle>
            </div>
            <Button
              onClick={() => setShowPasskeyModal(true)}
              size="sm"
              className="gap-2"
            >
              <Key className="w-4 h-4" />
              Add Passkey
            </Button>
          </div>
          <CardDescription>Manage your passkeys for secure passwordless login</CardDescription>
        </CardHeader>
        <CardContent>
          {passkeysLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : passkeys.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-900 mb-1">No passkeys yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                Add a passkey to login without a password using your phone or security key.
              </p>
              <Button onClick={() => setShowPasskeyModal(true)} className="gap-2">
                <Key className="w-4 h-4" />
                Add Your First Passkey
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {getDeviceIcon(passkey.deviceType)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{passkey.name}</p>
                      <p className="text-sm text-slate-500">
                        Added {formatDate(passkey.createdAt)}
                        {passkey.lastUsedAt && ` · Last used ${formatDate(passkey.lastUsedAt)}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePasskey(passkey.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passkey Registration Modal */}
      {showPasskeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Passkey</CardTitle>
              <CardDescription>
                Enter a name to identify this passkey device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passkeyName">Passkey Name</Label>
                <Input
                  id="passkeyName"
                  placeholder="e.g., iPhone 15, MacBook Pro"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                />
                <p className="text-sm text-slate-500">
                  Give your passkey a name to help you remember which device it is
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasskeyModal(false)
                    setPasskeyName('')
                  }}
                  className="flex-1"
                  disabled={registeringPasskey}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegisterPasskey}
                  className="flex-1 gap-2"
                  disabled={registeringPasskey}
                >
                  {registeringPasskey ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Add Passkey
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
