'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { startAuthentication } from '@simplewebauthn/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, KeyRound, Fingerprint, ArrowLeft } from 'lucide-react'

type LoginMethod = 'password' | 'otp' | 'passkey'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [otpSent, setOtpSent] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  })

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (!result || result.error) {
        throw new Error('Invalid email or password')
      }

      router.push(result.url || '/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    if (!formData.email) {
      setError('Please enter your email first')
      return
    }

    setOtpLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setOtpSent(true)
      setLoginMethod('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Invalid OTP')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handlePasskeyLogin = async () => {
    if (!formData.email) {
      setError('Please enter your email first')
      return
    }

    setPasskeyLoading(true)
    setError('')

    try {
      // Get authentication options from server
      const optionsRes = await fetch('/api/auth/passkey/auth-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const optionsData = await optionsRes.json()

      if (!optionsData.success) {
        throw new Error(optionsData.error || 'No passkeys found for this user')
      }

      // Use SimpleWebAuthn browser library to complete authentication
      const credential = await startAuthentication(optionsData.data)

      // Send the credential to server for verification
      const verifyRes = await fetch('/api/auth/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          userId: optionsData.userId,
          credentialId: credential.id
        })
      })

      const verifyData = await verifyRes.json()

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Passkey verification failed')
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Authentication cancelled or rejected. Please try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Passkey login failed')
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  // Note: Passkey login is handled via onClick on the Passkey button (outside the form).
  // When loginMethod is 'passkey', the form's onSubmit is not used - this is intentional
  // because passkey authentication is triggered directly by the button's onClick handler.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-white font-bold text-lg">LP</span>
          </div>
          <span className="font-bold text-2xl text-slate-900">LinkPay BD</span>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Card Header */}
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          {/* Login Method Tabs */}
          <div className="px-6 pb-4">
            <div role="tablist" className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <Button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'password'}
                variant={loginMethod === 'password' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginMethod('password')}
                className={`gap-2 ${loginMethod === 'password' ? 'shadow-md' : ''}`}
              >
                <KeyRound className="w-4 h-4" />
                <span className="hidden sm:inline">Password</span>
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'otp'}
                variant={loginMethod === 'otp' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginMethod('otp')}
                className={`gap-2 ${loginMethod === 'otp' ? 'shadow-md' : ''}`}
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">OTP</span>
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'passkey'}
                variant={loginMethod === 'passkey' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginMethod('passkey')}
                className={`gap-2 ${loginMethod === 'passkey' ? 'shadow-md' : ''}`}
              >
                <Fingerprint className="w-4 h-4" />
                <span className="hidden sm:inline">Passkey</span>
              </Button>
            </div>
          </div>

          <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleOtpLogin}>
            <CardContent className="space-y-4 pt-0">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  aria-required="true"
                  className="h-11"
                />
              </div>

              {loginMethod === 'password' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    aria-required="true"
                    className="h-11"
                  />
                </div>
              )}

              {loginMethod === 'otp' && (
                <>
                  {!otpSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11"
                      onClick={handleRequestOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send OTP to Email
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="otp" className="text-slate-700 font-medium">Enter 6-digit code</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          value={formData.otp}
                          onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                          required
                          aria-required="true"
                          className="h-12 text-center text-xl tracking-[0.5em] font-semibold"
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-center">
                        Check your email for the code. Expires in 5 minutes.
                      </p>
                    </div>
                  )}
                </>
              )}

              {loginMethod === 'passkey' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                >
                  {passkeyLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Sign in with Passkey
                    </>
                  )}
                </Button>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-0">
              {loginMethod !== 'passkey' && (
                <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading || (loginMethod === 'otp' && !otpSent)}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </Button>
              )}

              <div className="text-sm text-center text-slate-500">
                <p>
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    Create one
                  </Link>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  By signing in, you agree to our{' '}
                  <Link href="/terms" className="text-slate-500 hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-slate-500 hover:underline">Privacy Policy</Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Back to website */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to website
          </Link>
        </div>
      </div>
    </div>
  )
}
