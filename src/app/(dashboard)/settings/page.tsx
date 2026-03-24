import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, CreditCard, Building, CheckCircle, XCircle, Crown, ArrowRight, Check } from 'lucide-react'
import { ProfileForm } from './ProfileForm'
import { PayoutMethodsForm } from './PayoutMethodsForm'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">Please sign in to access settings</p>
        </div>
      </div>
    )
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      plan: true,
      bkashNumber: true,
      bankAccount: true,
      bankName: true,
      bankRouting: true,
      bkashVerified: true,
      bankVerified: true,
      emailVerified: true,
      createdAt: true
    }
  })

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">User not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and payout information</p>
      </div>

      {/* Plan Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Current Plan:</span>
        {user.plan === 'PREMIUM' ? (
          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 gap-1">
            <Crown className="w-3 h-3" />
            PREMIUM
          </Badge>
        ) : (
          <Badge variant="secondary">FREE</Badge>
        )}
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Profile Information
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <p className="font-medium">{user.email}</p>
              {user.emailVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </div>
              <p className="font-medium">{user.name || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span>Phone</span>
              </div>
              <p className="font-medium">{user.phone || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CreditCard className="w-4 h-4" />
                <span>Member Since</span>
              </div>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <ProfileForm user={{ name: user.name || '', email: user.email }} />
        </CardContent>
      </Card>

      {/* Payout Methods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" /> Payout Methods
          </CardTitle>
          <CardDescription>Configure how you receive payments</CardDescription>
        </CardHeader>
        <CardContent>
          <PayoutMethodsForm
            currentBkash={user.bkashNumber ? '***********' + user.bkashNumber.slice(-3) : null}
            currentBank={user.bankAccount ? '****' + (user.bankAccount.slice(-4) || '') : null}
            bankName={user.bankName}
            bankRouting={user.bankRouting}
            bkashVerified={user.bkashVerified}
            bankVerified={user.bankVerified}
          />
        </CardContent>
      </Card>

      {/* Upgrade to Premium Section */}
      {user.plan === 'FREE' && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Upgrade to Premium
            </CardTitle>
            <CardDescription>
              Unlock unlimited payment links and premium features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Feature Comparison */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">Free Plan</h4>
                <ul className="space-y-1 text-slate-600">
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    10 payment links
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    No branded invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    No advanced analytics
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-700">Premium Plan</h4>
                <ul className="space-y-1 text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Unlimited payment links
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Custom branded invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Advanced analytics
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <span className="text-2xl font-bold text-slate-900">৳999</span>
                <span className="text-slate-500">/month</span>
              </div>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 gap-2">
                <Link href="/premium">
                  Upgrade Now <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Benefits Reminder */}
      {user.plan === 'PREMIUM' && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Crown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900">You&apos;re a Premium Member!</h4>
                <p className="text-sm text-green-700">
                  Enjoy unlimited payment links, branded invoices, and advanced analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
