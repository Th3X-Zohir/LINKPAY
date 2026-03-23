import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, CreditCard, Smartphone, Shield, Zap, Clock, Wallet } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LP</span>
            </div>
            <span className="font-bold text-xl text-slate-900">LinkPay BD</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="#faq" className="text-sm text-slate-600 hover:text-slate-900">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Get Paid by International<br />
            <span className="text-blue-600">Clients in Seconds</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Create professional payment links and accept Visa, Mastercard payments directly to your bKash or bank account. No complex setup required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Getting Paid <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Login to Dashboard
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">Free to start • 0.75% platform fee only</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold">650K+</div>
              <div className="text-blue-100 text-sm">Bangladeshi Freelancers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">৳1.5L+</div>
              <div className="text-blue-100 text-sm">Avg. Monthly Earnings</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">96.7%</div>
              <div className="text-blue-100 text-sm">You Receive</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">30s</div>
              <div className="text-blue-100 text-sm">Link Creation Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Get Paid
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Simple, fast, and designed for Bangladeshi freelancers working with international clients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Instant Payment Links</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create a payment link in under 30 seconds. Share via WhatsApp, email, or any platform your client prefers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Card Payments Accepted</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Accept Visa and Mastercard from clients worldwide. No need for Payoneer or Wise.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Auto bKash Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Money lands in your bKash or bank account within 1-2 days automatically.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Bank-grade security with aamarPay integration. Your money is always safe.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get instant notifications when clients view or pay your invoices.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wallet className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Lowest Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Only 0.75% platform fee. Keep 96.7% of every payment you receive.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-slate-600">Three simple steps to get paid</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-lg mb-2">Create Link</h3>
              <p className="text-slate-600 text-sm">Enter amount and description. Get your payment link instantly.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-lg mb-2">Share with Client</h3>
              <p className="text-slate-600 text-sm">Send via WhatsApp, email, or any platform. Your client clicks to pay.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-lg mb-2">Get Paid</h3>
              <p className="text-slate-600 text-sm">Client pays with card. Money arrives to bKash in 1-2 days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Ready to Get Paid?
          </h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Join thousands of Bangladeshi freelancers who trust LinkPay BD for their international payments.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <span className="font-bold text-slate-900">LinkPay BD</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 LinkPay BD. The simplest payment link platform for Bangladeshi freelancers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
