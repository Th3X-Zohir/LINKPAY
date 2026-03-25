'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

interface SelectedDocuments {
  nidFront: File | null
  nidBack: File | null
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

  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocuments>({
    nidFront: null,
    nidBack: null,
  })
  const nidFrontInputRef = useRef<HTMLInputElement>(null)
  const nidBackInputRef = useRef<HTMLInputElement>(null)

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
        if (formData.nid && !/^(\d{13}|\d{17})$/.test(formData.nid)) return 'Invalid NID format (13 or 17 digits)'
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

      // Upload documents if selected
      const documentsToUpload = [
        { file: selectedDocuments.nidFront, type: 'ID_PROOF' as const },
        { file: selectedDocuments.nidBack, type: 'ID_PROOF' as const },
      ]

      for (const doc of documentsToUpload) {
        if (doc.file) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', doc.file)
          uploadFormData.append('type', doc.type)

          const uploadRes = await fetch('/api/users/documents', {
            method: 'POST',
            body: uploadFormData,
          })

          if (!uploadRes.ok) {
            console.error('Failed to upload document:', doc.type)
          }
        }
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
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, index) => {
        const Icon = step.icon
        const isActive = step.id === currentStep
        const isCompleted = index < stepIndex || (step.id === 'documents' && currentStep === 'complete')

        return (
          <div key={step.id} className="flex items-center">
            <div
              aria-label={`Step ${index + 1} of ${STEPS.length}: ${step.label}`}
              className={`
                flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300
                ${isActive ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : isCompleted ? 'border-green-600 bg-gradient-to-br from-green-500 to-green-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-400'}
              `}>
              {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 mx-0.5 transition-all duration-300 ${index < stepIndex ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-slate-200'}`} />
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
        <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="rahul@example.com"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          required
          aria-required="true"
          className="h-11"
        />
        <p className="text-xs text-slate-500">This will be used for login and verification</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          required
          aria-required="true"
          minLength={6}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
          required
          aria-required="true"
          minLength={6}
          className="h-11"
        />
      </div>
    </div>
  )

  // Step 2: Personal Info
  const renderPersonalStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Rahul Ahmed"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          required
          aria-required="true"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-slate-700 font-medium">Phone Number (bKash)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="01XXXXXXXXX"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          required
          aria-required="true"
          className="h-11"
        />
        <p className="text-xs text-slate-500">Enter your bKash registered number for payouts</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nid" className="text-slate-700 font-medium">National ID (NID)</Label>
        <Input
          id="nid"
          type="text"
          placeholder="13-digit NID number"
          value={formData.nid}
          onChange={(e) => updateFormData('nid', e.target.value)}
          required
          aria-required="true"
          className="h-11"
        />
        <p className="text-xs text-slate-500">Required for KYC verification (FULL level)</p>
      </div>
    </div>
  )

  // Step 3: Business Info
  const renderBusinessStep = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Optional:</strong> Add your business details to get a{' '}
          <span className="font-semibold text-amber-900">BUSINESS</span> badge and appear more professional to clients.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-slate-700 font-medium">Business Name</Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Rahul's Design Studio"
          value={formData.businessName}
          onChange={(e) => updateFormData('businessName', e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessAddress" className="text-slate-700 font-medium">Business Address</Label>
        <Input
          id="businessAddress"
          type="text"
          placeholder="House 12, Road 5, Dhanmondi, Dhaka"
          value={formData.businessAddress}
          onChange={(e) => updateFormData('businessAddress', e.target.value)}
          className="h-11"
        />
      </div>
    </div>
  )

  // Step 4: Payout Setup
  const renderPayoutStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bkashNumber" className="text-slate-700 font-medium">bKash Number (Primary)</Label>
        <Input
          id="bkashNumber"
          type="tel"
          placeholder="01XXXXXXXXX"
          value={formData.bkashNumber}
          onChange={(e) => updateFormData('bkashNumber', e.target.value)}
          required
          aria-required="true"
          className="h-11"
        />
        <p className="text-xs text-slate-500">Your earnings will be sent to this number</p>
      </div>

      <div className="border-t border-slate-100 pt-4 mt-4">
        <h4 className="font-medium mb-4 flex items-center gap-2 text-slate-700">
          <Building className="w-4 h-4 text-slate-500" /> Bank Account (Optional)
        </h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName" className="text-slate-700 font-medium">Bank Name</Label>
            <Input
              id="bankName"
              type="text"
              placeholder="e.g., Dhaka Bank"
              value={formData.bankName}
              onChange={(e) => updateFormData('bankName', e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount" className="text-slate-700 font-medium">Account Number</Label>
            <Input
              id="bankAccount"
              type="text"
              placeholder="Account number"
              value={formData.bankAccount}
              onChange={(e) => updateFormData('bankAccount', e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankRouting" className="text-slate-700 font-medium">Routing Number</Label>
            <Input
              id="bankRouting"
              type="text"
              placeholder="Routing number"
              value={formData.bankRouting}
              onChange={(e) => updateFormData('bankRouting', e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Step 5: Email Verification
  const renderVerificationStep = () => (
    <div className="text-center py-4">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200/50">
        <Mail className="w-10 h-10 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
      <p className="text-slate-600 mb-4">
        We&apos;ve sent a verification link to<br />
        <strong className="text-blue-600">{registeredEmail}</strong>
      </p>
      <p className="text-sm text-slate-500 mb-6">
        Click the link in your email to verify your account and continue setup.
      </p>
      <div className="space-y-3">
        <Button onClick={handleVerifyEmail} disabled={loading} className="w-full h-11 gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              I&apos;ve Verified My Email
              <ArrowRight className="w-4 h-4" />
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
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> Upload a clear photo of your NID (front and back) to complete KYC verification and unlock all features.
        </p>
      </div>
      <div className="space-y-4">
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer bg-slate-50/50"
          role="button"
          tabIndex={0}
          onClick={() => nidFrontInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nidFrontInputRef.current?.click(); } }}
          aria-label="Upload NID Front"
        >
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">
            {selectedDocuments.nidFront ? selectedDocuments.nidFront.name : 'Upload NID Front'}
          </p>
          <p className="text-xs text-slate-400">JPG, PNG or PDF (max 10MB)</p>
        </div>
        <input
          type="file"
          ref={nidFrontInputRef}
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            setSelectedDocuments(prev => ({ ...prev, nidFront: file }))
          }}
        />
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer bg-slate-50/50"
          role="button"
          tabIndex={0}
          onClick={() => nidBackInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nidBackInputRef.current?.click(); } }}
          aria-label="Upload NID Back"
        >
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">
            {selectedDocuments.nidBack ? selectedDocuments.nidBack.name : 'Upload NID Back'}
          </p>
          <p className="text-xs text-slate-400">JPG, PNG or PDF (max 10MB)</p>
        </div>
        <input
          type="file"
          ref={nidBackInputRef}
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            setSelectedDocuments(prev => ({ ...prev, nidBack: file }))
          }}
        />
        <p className="text-xs text-slate-500 text-center">
          You can skip this step and upload documents later from your dashboard.
        </p>
      </div>
    </div>
  )

  // Complete
  const renderCompleteStep = () => (
    <div className="text-center py-6">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200/50">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re All Set!</h2>
      <p className="text-slate-600 mb-6">
        Your account has been created and KYC information saved.<br />
        Start accepting payments today!
      </p>
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto border border-slate-100">
        <h3 className="font-semibold mb-3 text-slate-900">What&apos;s Next?</h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" /> Create your first payment link
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" /> Share with clients worldwide
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" /> Receive payments in bKash
          </li>
        </ul>
      </div>
      <Button onClick={() => router.push('/dashboard')} className="gap-2 h-11 px-6 text-base font-medium">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-lg">LP</span>
            </div>
            <span className="font-bold text-2xl text-slate-900">LinkPay BD</span>
          </div>
          <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardContent className="pt-6">
              {renderCompleteStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-white font-bold text-lg">LP</span>
          </div>
          <span className="font-bold text-2xl text-slate-900">LinkPay BD</span>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Card Header */}
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {currentStep === 'account' ? 'Create Account' :
               currentStep === 'personal' ? 'Personal Information' :
               currentStep === 'business' ? 'Business Details' :
               currentStep === 'payout' ? 'Payout Setup' :
               currentStep === 'verification' ? 'Email Verification' :
               'Upload Documents'}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {currentStep === 'account' ? 'Step 1 of 5 - Set up your account' :
               currentStep === 'personal' ? 'Step 2 of 5 - Tell us about yourself' :
               currentStep === 'business' ? 'Step 3 of 5 - Optional business info' :
               currentStep === 'payout' ? 'Step 4 of 5 - Where to send your money' :
               currentStep === 'verification' ? 'Step 5 of 5 - Verify your email' :
               'Final step - Verify your identity'}
            </CardDescription>
          </CardHeader>

          {/* Step Indicator */}
          <div className="px-6 pb-2">
            {renderStepIndicator()}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleNext() }}>
            <CardContent className="space-y-4 pt-0">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {renderStep()}
            </CardContent>

            {['account', 'personal', 'business', 'payout', 'documents'].includes(currentStep) && (
              <CardFooter className="flex justify-between pt-0">
                {stepIndex > 0 ? (
                  <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep === 'documents' ? (
                  <Button type="button" onClick={handleComplete} disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                ) : currentStep === 'verification' ? null : (
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            )}
          </form>
        </Card>

        {/* Already have account */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
