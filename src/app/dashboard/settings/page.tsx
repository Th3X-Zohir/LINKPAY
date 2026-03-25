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
import {
  User,
  Wallet,
  Building,
  Save,
  Loader2,
  FileText,
  ArrowRight,
  Key,
  Trash2,
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

interface Passkey {
  id: string
  name: string
  deviceType: string | null
  createdAt: string
  lastUsedAt: string | null
}

interface FormData {
  name: string
  phone: string
  bkashNumber: string
  bankAccount: string
  bankName: string
  bankRouting: string
}

export default function SettingsPage() {
  const sessionResult = useSession()
  const session = sessionResult?.data
  const status = sessionResult?.status || 'loading'
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bkashError, setBkashError] = useState<string | null>(null)
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [passkeysLoading, setPasskeysLoading] = useState(true)
  const [registeringPasskey, setRegisteringPasskey] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')
  const [showPasskeyModal, setShowPasskeyModal] = useState(false)
  const [formData, setFormData] = useState<FormData>({
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
      const optionsRes = await fetch('/api/auth/passkey/register-options')
      const optionsData = await optionsRes.json()

      if (!optionsData.success) {
        throw new Error(optionsData.error || 'Failed to get registration options')
      }

      const options = optionsData.data
      const challengeBuffer = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0))
      const userIdBuffer = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0))

      const excludeCredentials = options.excludeCredentials?.map((cred: { id: string; type: string; transports?: string[] }) => ({
        ...cred,
        id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
        transports: cred.transports || undefined
      })) || []

      const publicKeyOptions = {
        ...options,
        challenge: challengeBuffer,
        user: {
          ...options.user,
          id: userIdBuffer
        },
        excludeCredentials
      }

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      const credentialJSON = {
        id: credential.id,
        rawId: Buffer.from(credential.rawId).toString('base64url'),
        type: credential.type,
        response: {
          attestationObject: Buffer.from((credential.response as AuthenticatorAttestationResponse).attestationObject).toString('base64url'),
          clientDataJSON: Buffer.from((credential.response as AuthenticatorAttestationResponse).clientDataJSON).toString('base64url')
        }
      }

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
    setLoading(true)
    setError(null)
    setSuccess(null)
    setBkashError(null)

    if (formData.bkashNumber) {
      const bkashRegex = /^01[3-9]\d{8}$/
      if (!bkashRegex.test(formData.bkashNumber.replace(/\s/g, ''))) {
        setBkashError('Invalid bKash number. Must be 01XXXXXXXXX format.')
        setLoading(false)
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

      setSuccess('Payout methods saved successfully!')
      toast.success('Payout methods updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      toast.error(err instanceof Error ? err.message : 'Failed to save payout methods')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

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

      setSuccess('Profile updated successfully!')
      router.refresh()
      toast.success('Profile updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const hasBankInfo = formData.bankAccount && formData.bankName

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account, payout methods, and security</p>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="payout" className="gap-2">
            <Wallet className="w-4 h-4" />
            Payout
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Profile Information
              </CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent>
              {!profileLoaded ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {/* Email - Read Only */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">Email cannot be changed</p>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={loading} className="gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Tab */}
        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-600" />
                Payout Information
              </CardTitle>
              <CardDescription>Where your earnings will be sent</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayoutMethodsSubmit} className="space-y-6">
                {/* bKash Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-pink-600" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm6 0h-2v-6h2v6zm-3-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">bKash Number</h4>
                      <p className="text-sm text-slate-500">Primary payout method. Min withdrawal: ৳5.00</p>
                    </div>
                  </div>
                  <div className="pl-13">
                    <Input
                      id="bkashNumber"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={formData.bkashNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, bkashNumber: e.target.value })
                        setBkashError(null)
                      }}
                      className={bkashError ? 'border-red-500' : ''}
                    />
                    {bkashError && (
                      <p className="text-sm text-red-600 mt-1">{bkashError}</p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-slate-500">or</span>
                  </div>
                </div>

                {/* Bank Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Bank Account</h4>
                      <p className="text-sm text-slate-500">Alternative payout method (Optional)</p>
                    </div>
                  </div>
                  <div className="pl-13 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankRouting">Routing Number</Label>
                      <Input
                        id="bankRouting"
                        type="text"
                        placeholder="6-digit routing number"
                        value={formData.bankRouting}
                        onChange={(e) => setFormData({ ...formData, bankRouting: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {hasBankInfo ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-slate-600">Bank details configured</span>
                      </>
                    ) : formData.bkashNumber ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-slate-600">bKash configured</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-amber-600" />
                        <span className="text-sm text-slate-600">No payout method configured</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Payout Methods
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Invoice Settings */}
            <Link href="/dashboard/settings/invoice-settings">
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
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-purple-600" />
                      Passkeys
                    </CardTitle>
                    <CardDescription>Manage your passkeys for secure passwordless login</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowPasskeyModal(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Passkey
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {passkeysLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
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
                      <Plus className="w-4 h-4" />
                      Add Your First Passkey
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {passkeys.map((passkey) => (
                      <div
                        key={passkey.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-100 rounded-lg">
                            {getDeviceIcon(passkey.deviceType)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{passkey.name}</p>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span>Added {formatDate(passkey.createdAt)}</span>
                              {passkey.lastUsedAt && (
                                <>
                                  <span>•</span>
                                  <span>Last used {formatDate(passkey.lastUsedAt)}</span>
                                </>
                              )}
                            </div>
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Passkey Registration Modal */}
      <Dialog open={showPasskeyModal} onOpenChange={setShowPasskeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              Add Passkey
            </DialogTitle>
            <DialogDescription>
              Enter a name to identify this passkey device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasskeyModal(false)
                setPasskeyName('')
              }}
              disabled={registeringPasskey}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegisterPasskey}
              disabled={registeringPasskey}
              className="gap-2"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}