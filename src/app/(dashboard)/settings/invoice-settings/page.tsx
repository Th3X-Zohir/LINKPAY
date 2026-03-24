'use client'

import { useState, useEffect } from 'react'
import { Building, MapPin, Image, FileText, Save, AlertCircle, CheckCircle, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface InvoiceSettings {
  businessName: string | null
  businessAddress: string | null
  businessLogo: string | null
  defaultPaymentTerms: string | null
  plan: 'FREE' | 'PREMIUM'
}

export default function InvoiceSettingsPage() {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessLogo, setBusinessLogo] = useState('')
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/users/invoice-settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
        setBusinessName(data.data.businessName || '')
        setBusinessAddress(data.data.businessAddress || '')
        setBusinessLogo(data.data.businessLogo || '')
        setDefaultPaymentTerms(data.data.defaultPaymentTerms || '')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch invoice settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/users/invoice-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName || null,
          businessAddress: businessAddress || null,
          businessLogo: businessLogo || null,
          defaultPaymentTerms: defaultPaymentTerms || null
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        toast.success("Settings saved", { duration: 5000 })
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to save invoice settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoice Settings</h1>
          <p className="text-slate-600">Customize your invoice appearance</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is premium
  if (settings?.plan !== 'PREMIUM') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoice Settings</h1>
          <p className="text-slate-600">Customize your invoice appearance</p>
        </div>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Premium Feature
            </CardTitle>
            <CardDescription>
              Invoice customization is only available for Premium members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              Upgrade to Premium to unlock:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Custom business name on invoices
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Business address display
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Logo upload
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Default payment terms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Remove LinkPay branding
              </li>
            </ul>
            <Button className="bg-amber-500 hover:bg-amber-600 gap-2" asChild>
              <a href="/premium">
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoice Settings</h1>
        <p className="text-slate-600">Customize how your invoices appear to clients</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />
          Invoice settings saved successfully
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            This information will appear on your invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Business"
            />
            <p className="text-sm text-slate-500">
              The name that will appear as the &quot;From&quot; on your invoices
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">
              <MapPin className="w-4 h-4 inline mr-1" />
              Business Address
            </Label>
            <textarea
              id="businessAddress"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="123 Business Street, Dhaka, Bangladesh"
              className="w-full h-24 rounded-md border border-input bg-white px-3 py-2 text-sm"
            />
            <p className="text-sm text-slate-500">
              Your business address for invoice billing
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize your invoice branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessLogo">Logo URL</Label>
            <Input
              id="businessLogo"
              value={businessLogo}
              onChange={(e) => setBusinessLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-sm text-slate-500">
              Enter a URL to your logo image (recommended: 200x50px, PNG or JPG)
            </p>
          </div>

          {businessLogo && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <p className="text-sm text-slate-500 mb-2">Logo Preview:</p>
              <img
                src={businessLogo}
                alt="Logo preview"
                className="h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment Terms
          </CardTitle>
          <CardDescription>
            Set default payment terms for your invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
            <textarea
              id="defaultPaymentTerms"
              value={defaultPaymentTerms}
              onChange={(e) => setDefaultPaymentTerms(e.target.value)}
              placeholder="Payment is due within 14 days of invoice date..."
              className="w-full h-24 rounded-md border border-input bg-white px-3 py-2 text-sm"
            />
            <p className="text-sm text-slate-500">
              This text will appear at the bottom of your invoices
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}