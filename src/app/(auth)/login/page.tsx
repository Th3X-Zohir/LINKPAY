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
import { Loader2, Mail, KeyRound, Fingerprint } from 'lucide-react'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LP</span>
            </div>
            <span className="font-bold text-xl">LinkPay BD</span>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Choose your login method
          </CardDescription>
        </CardHeader>

        {/* Login Method Tabs */}
        <div role="tablist" className="px-6 flex gap-2">
          <Button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'password'}
            variant={loginMethod === 'password' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoginMethod('password')}
            className="flex-1 gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Password
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'otp'}
            variant={loginMethod === 'otp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoginMethod('otp')}
            className="flex-1 gap-2"
          >
            <Mail className="w-4 h-4" />
            OTP
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'passkey'}
            variant={loginMethod === 'passkey' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoginMethod('passkey')}
            className="flex-1 gap-2"
          >
            <Fingerprint className="w-4 h-4" />
            Passkey
          </Button>
        </div>

        <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleOtpLogin}>
          <CardContent className="space-y-4 mt-4">
            {error && (
              <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                aria-required="true"
              />
            </div>

            {loginMethod === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  aria-required="true"
                />
              </div>
            )}

            {loginMethod === 'otp' && (
              <>
                {!otpSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
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
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter 6-digit code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                      required
                      aria-required="true"
                      className="text-center text-lg tracking-widest"
                    />
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
                className="w-full"
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

          <CardFooter className="flex flex-col space-y-4">
            {loginMethod !== 'passkey' && (
              <Button type="submit" className="w-full" disabled={loading || (loginMethod === 'otp' && !otpSent)}>
                {loading ? 'Loading...' : 'Sign In'}
              </Button>
            )}

            <div className="text-sm text-center space-y-2">
              <p>
                <Link href="/register" className="text-blue-600 hover:underline">
                  Create an account
                </Link>
              </p>
              <p>
                <Link href="/auth/forgot-password" className="text-slate-500 hover:underline text-xs">
                  Forgot password?
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
