'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Mail, ArrowRight, ArrowLeft, Shield, Wallet, User, Building, FileText, Loader2 } from 'lucide-react'

type RegistrationStep = 'account' | 'personal' | 'business' | 'payout' | 'verification' | 'documents' | 'complete'

interface RegistrationData {
  // Step 1: Account
  email: string
  password: string
  confirmPassword: string
  // Step 2: Personal
  name: string
  phone: string
  nid: string
  // Step 3: Business
  businessName: string
  businessAddress: string
  // Step 4: Payout
  bkashNumber: string
  bankName: string
  bankAccount: string
  bankRouting: string
}

const STEPS: { id: RegistrationStep; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'personal', label: 'Personal', icon: Shield },
  { id: 'business', label: 'Business', icon: Building },
  { id: 'payout', label: 'Payout', icon: Wallet },
  { id: 'verification', label: 'Verify', icon: Mail },
  { id: 'documents', label: 'Documents', icon: FileText },
]

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    nid: '',
    businessName: '',
    businessAddress: '',
    bkashNumber: '',
    bankName: '',
    bankAccount: '',
    bankRouting: '',
  })

  const stepIndex = STEPS.findIndex(s => s.id === currentStep)

  const validateStep = (step: RegistrationStep): string | null => {
    switch (step) {
      case 'account':
        if (!formData.email) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format'
        if (!formData.password) return 'Password is required'
        if (formData.password.length < 6) return 'Password must be at least 6 characters'
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
        return null
      case 'personal':
        if (!formData.name) return 'Full name is required'
        if (!formData.phone) return 'Phone number is required'
        if (!/^01[3-9]\d{8}$/.test(formData.phone)) return 'Invalid bKash number format (01XXXXXXXXX)'
        return null
      case 'payout':
        if (!formData.bkashNumber) return 'bKash number is required'
        if (!/^01[3-9]\d{8}$/.test(formData.bkashNumber)) return 'Invalid bKash number format'
        return null
      default:
        return null
    }
  }

  const handleNext = async () => {
    const validationError = validateStep(currentStep)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')

    // If moving from account step, create the account
    if (currentStep === 'account') {
      await handleCreateAccount()
      return
    }

    // If moving to verification step, trigger email verification
    if (currentStep === 'payout') {
      setCurrentStep('verification')
      return
    }

    // Move to next step
    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }

  const handleBack = () => {
    const prevIndex = stepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  const handleCreateAccount = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || undefined,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setRegisteredEmail(formData.email)
      setCurrentStep('personal')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail })
      })
    } catch (err) {
      console.error('Failed to resend:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    setLoading(true)
    setError('')

    try {
      // In a real implementation, this would be triggered by the verification link
      // For now, we'll simulate verification after a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCurrentStep('documents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      // Save all KYC data
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          nid: formData.nid,
          businessName: formData.businessName || undefined,
          businessAddress: formData.businessAddress || undefined,
          bkashNumber: formData.bkashNumber,
          bankName: formData.bankName || undefined,
          bankAccount: formData.bankAccount || undefined,
          bankRouting: formData.bankRouting || undefined
        })
      })

      if (!res.ok) {
        throw new Error('Failed to save profile')
      }

      setCurrentStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  // Step progress indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => {
        const Icon = step.icon
        const isActive = step.id === currentStep
        const isCompleted = index < stepIndex || (step.id === 'documents' && currentStep === 'complete')

        return (
          <div key={step.id} className="flex items-center">
            <div
              aria-label={`Step ${index + 1} of ${STEPS.length}: ${step.label}`}
              className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
              ${isActive ? 'border-blue-600 bg-blue-600 text-white' : isCompleted ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 text-slate-400'}
            `}>
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${index < stepIndex ? 'bg-green-600' : 'bg-slate-300'}`} />
            )}
          </div>
        )
      })}
    </div>
  )

  // Step 1: Account Setup
  const renderAccountStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="rahul@example.com"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          required
          aria-required="true"
        />
        <p className="text-sm text-slate-500">This will be used for login and verification</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          required
          aria-required="true"
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
          required
          aria-required="true"
          minLength={6}
        />
      </div>
    </div>
  )

  // Step 2: Personal Info
  const renderPersonalStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Rahul Ahmed"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          required
          aria-required="true"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (bKash)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="01XXXXXXXXX"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          required
          aria-required="true"
        />
        <p className="text-sm text-slate-500">Enter your bKash registered number for payouts</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nid">National ID (NID)</Label>
        <Input
          id="nid"
          type="text"
          placeholder="13-digit NID number"
          value={formData.nid}
          onChange={(e) => updateFormData('nid', e.target.value)}
        />
        <p className="text-sm text-slate-500">Required for KYC verification (FULL level)</p>
      </div>
    </div>
  )

  // Step 3: Business Info
  const renderBusinessStep = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Optional:</strong> Add your business details to get a BUSINESS badge and appear more professional to clients.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Rahul's Design Studio"
          value={formData.businessName}
          onChange={(e) => updateFormData('businessName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessAddress">Business Address</Label>
        <Input
          id="businessAddress"
          type="text"
          placeholder="House 12, Road 5, Dhanmondi, Dhaka"
          value={formData.businessAddress}
          onChange={(e) => updateFormData('businessAddress', e.target.value)}
        />
      </div>
    </div>
  )

  // Step 4: Payout Setup
  const renderPayoutStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bkashNumber">bKash Number (Primary)</Label>
        <Input
          id="bkashNumber"
          type="tel"
          placeholder="01XXXXXXXXX"
          value={formData.bkashNumber}
          onChange={(e) => updateFormData('bkashNumber', e.target.value)}
          required
          aria-required="true"
        />
        <p className="text-sm text-slate-500">Your earnings will be sent to this number</p>
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
              onChange={(e) => updateFormData('bankName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Account Number</Label>
            <Input
              id="bankAccount"
              type="text"
              placeholder="Account number"
              value={formData.bankAccount}
              onChange={(e) => updateFormData('bankAccount', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankRouting">Routing Number</Label>
            <Input
              id="bankRouting"
              type="text"
              placeholder="Routing number"
              value={formData.bankRouting}
              onChange={(e) => updateFormData('bankRouting', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Step 5: Email Verification
  const renderVerificationStep = () => (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
      <p className="text-slate-600 mb-6">
        We&apos;ve sent a verification link to<br />
        <strong>{registeredEmail}</strong>
      </p>
      <p className="text-sm text-slate-500 mb-6">
        Click the link in your email to verify your account and continue setup.
      </p>
      <div className="space-y-3">
        <Button onClick={handleVerifyEmail} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              I&apos;ve Verified My Email
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
        <p className="text-xs text-slate-500">
          Didn&apos;t receive the email?{' '}
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="text-blue-600 hover:underline"
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  )

  // Step 6: Documents
  const renderDocumentsStep = () => (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> Upload a clear photo of your NID (front and back) to complete KYC verification and unlock all features.
        </p>
      </div>
      <div className="space-y-4">
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        >
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Upload NID Front</p>
          <p className="text-xs text-slate-400">JPG, PNG or PDF (max 10MB)</p>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png,.pdf" />
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        >
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Upload NID Back</p>
          <p className="text-xs text-slate-400">JPG, PNG or PDF (max 10MB)</p>
        </div>
        <p className="text-xs text-slate-500 text-center">
          You can skip this step and upload documents later from your dashboard.
        </p>
      </div>
    </div>
  )

  // Complete
  const renderCompleteStep = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re All Set!</h2>
      <p className="text-slate-600 mb-6">
        Your account has been created and KYC information saved.<br />
        Start accepting payments today!
      </p>
      <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
        <h3 className="font-medium mb-2">What&apos;s Next?</h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Create your first payment link
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Share with clients worldwide
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Receive payments in bKash
          </li>
        </ul>
      </div>
      <Button onClick={() => router.push('/dashboard')} className="gap-2">
        Go to Dashboard
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 'account': return renderAccountStep()
      case 'personal': return renderPersonalStep()
      case 'business': return renderBusinessStep()
      case 'payout': return renderPayoutStep()
      case 'verification': return renderVerificationStep()
      case 'documents': return renderDocumentsStep()
      case 'complete': return renderCompleteStep()
      default: return null
    }
  }

  // Don't show step indicator on complete page
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            {renderCompleteStep()}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LP</span>
            </div>
            <span className="font-bold text-xl">LinkPay BD</span>
          </div>
          <CardTitle className="text-2xl">
            {currentStep === 'account' ? 'Create Account' :
             currentStep === 'personal' ? 'Personal Information' :
             currentStep === 'business' ? 'Business Details' :
             currentStep === 'payout' ? 'Payout Setup' :
             currentStep === 'verification' ? 'Email Verification' :
             'Upload Documents'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'account' ? 'Step 1 of 5 - Set up your account' :
             currentStep === 'personal' ? 'Step 2 of 5 - Tell us about yourself' :
             currentStep === 'business' ? 'Step 3 of 5 - Optional business info' :
             currentStep === 'payout' ? 'Step 4 of 5 - Where to send your money' :
             currentStep === 'verification' ? 'Step 5 of 5 - Verify your email' :
             'Final step - Verify your identity'}
          </CardDescription>
        </CardHeader>

        {renderStepIndicator()}

        <form onSubmit={(e) => { e.preventDefault(); handleNext() }}>
          <CardContent className="space-y-4">
            {error && (
              <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            {renderStep()}
          </CardContent>

          {['account', 'personal', 'business', 'payout', 'documents'].includes(currentStep) && (
            <CardFooter className="flex justify-between">
              {stepIndex > 0 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep === 'documents' ? (
                <Button type="button" onClick={handleComplete} disabled={loading}>
                  {loading ? 'Processing...' : 'Complete Setup'}
                </Button>
              ) : currentStep === 'verification' ? null : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          )}
        </form>

        <div className="px-6 pb-4 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
