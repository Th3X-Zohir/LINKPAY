'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PremiumBadge } from '@/components/premium/PremiumBadge'
import { Crown, Check, ArrowRight, Star, Zap, Shield, BarChart3, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const FREE_FEATURES = [
  { name: 'Payment links', limit: '10 links', included: true },
  { name: 'Platform fee', limit: '0.75%', included: true },
  { name: 'Branded invoices', limit: 'Not available', included: false },
  { name: 'Priority support', limit: 'Not available', included: false },
  { name: 'Advanced analytics', limit: 'Not available', included: false },
  { name: 'Custom domain', limit: 'Not available', included: false }
]

const PREMIUM_FEATURES = [
  { name: 'Payment links', limit: 'Unlimited', included: true },
  { name: 'Platform fee', limit: '0.75%', included: true },
  { name: 'Branded invoices', limit: 'Custom logo & colors', included: true },
  { name: 'Priority support', limit: '24/7 dedicated', included: true },
  { name: 'Advanced analytics', limit: 'Full insights', included: true },
  { name: 'Custom domain', limit: 'Your domain', included: true }
]

const TESTIMONIALS = [
  {
    name: 'Rafiq Ahmed',
    role: 'Top-rated Fiverr Freelancer',
    quote: 'LinkPay Premium helped me get paid 40% faster with professional invoices.',
    avatar: 'RA'
  },
  {
    name: 'Sadia Khan',
    role: 'Upwork Expert',
    quote: 'The analytics dashboard gives me insights I never had before.',
    avatar: 'SK'
  },
  {
    name: 'Mahbub Rahman',
    role: 'Independent Developer',
    quote: 'Custom branded links increased my client trust significantly.',
    avatar: 'MR'
  }
]

export default function PremiumPage() {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    fetch('/api/users/profile')
        .then(res => res.json())
        .then(data => {
          if (data.data?.plan === 'PREMIUM') {
            setIsPremium(true)
          }
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST'
      })
      const data = await res.json()

      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl
      } else {
        toast.error(data.error || 'Failed to create checkout')
        setCheckoutLoading(false)
      }
    } catch (error) {
      toast.error('Failed to create checkout')
      setCheckoutLoading(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100">
            <Crown className="w-12 h-12 text-amber-600" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          {isPremium ? 'You\'re a Premium Member!' : 'Upgrade to Premium'}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {isPremium
            ? 'Thank you for your support. Enjoy all premium features.'
            : 'Unlock unlimited payment links, branded invoices, and advanced analytics for just ৳999/month'}
        </p>
        {isPremium && (
          <div className="flex justify-center">
            <PremiumBadge size="lg" />
          </div>
        )}
      </div>

      {/* Pricing Card */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Free Plan */}
        <Card className={isPremium ? 'opacity-60' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-slate-500" />
              Free Plan
            </CardTitle>
            <CardDescription>For freelancers just starting</CardDescription>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              ৳0<span className="text-base font-normal text-slate-500">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {FREE_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 text-slate-300 flex-shrink-0 text-center">—</span>
                  )}
                  <div className="flex-1">
                    <span className={feature.included ? 'text-slate-900' : 'text-slate-400'}>
                      {feature.name}
                    </span>
                    <span className="text-slate-500 text-sm ml-2">{feature.limit}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="border-amber-200 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
            POPULAR
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Premium Plan
            </CardTitle>
            <CardDescription>For serious freelancers</CardDescription>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              ৳999<span className="text-base font-normal text-slate-500">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PREMIUM_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-900">{feature.name}</span>
                    <span className="text-slate-500 text-sm ml-2">{feature.limit}</span>
                  </div>
                </li>
              ))}
            </ul>

            {!isPremium && (
              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full gap-2 bg-amber-500 hover:bg-amber-600 mt-6"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upgrade Now <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}

            {isPremium && (
              <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700 text-sm text-center">
                  You have access to all premium features
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="py-8">
        <h2 className="text-2xl font-bold text-center mb-8">Why Go Premium?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="p-2 w-12 h-12 rounded-lg bg-blue-100 mb-2">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Unlimited Links</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Create as many payment links as you need. No more limits on your earning potential.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 w-12 h-12 rounded-lg bg-purple-100 mb-2">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Professional Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Custom branded invoices with your logo and colors. Build trust with clients.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 w-12 h-12 rounded-lg bg-green-100 mb-2">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Get detailed insights into your earnings, client behavior, and payment trends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-8">
        <h2 className="text-2xl font-bold text-center mb-8">What Premium Members Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">&quot;{testimonial.quote}&quot;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      {!isPremium && (
        <div className="text-center py-8">
          <p className="text-slate-600 mb-4">Ready to take your freelance business to the next level?</p>
          <Button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            size="lg"
            className="gap-2 bg-amber-500 hover:bg-amber-600"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Upgrade to Premium <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-sm text-slate-500 mt-2">Cancel anytime. No questions asked.</p>
        </div>
      )}
    </div>
  )
}