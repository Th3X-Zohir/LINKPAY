import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  CreditCard,
  Smartphone,
  Shield,
  Zap,
  Clock,
  Wallet,
  Check,
  ChevronDown,
  Star,
  Quote,
  Menu,
  X,
  Users,
  TrendingUp,
  Clock3,
  CreditCardIcon,
  Lock,
  Bell,
  Percent,
  Link2,
  Share2,
  Banknote,
} from 'lucide-react'
import { MobileMenuClient } from './MobileMenuClient'
import { FAQAccordion } from './FAQAccordion'

// SEO Metadata
export const metadata = {
  title: 'LinkPay BD - Get Paid in Minutes, Not Weeks',
  description: 'Create payment links in 30 seconds, accept international cards, receive bKash payouts within 24 hours. Only 0.75% platform fee.',
  keywords: ['payment links', 'bKash', 'freelancer', 'Bangladesh', 'international payments', 'aamarPay'],
  openGraph: {
    title: 'LinkPay BD - Get Paid in Minutes, Not Weeks',
    description: 'Create payment links in 30 seconds, accept international cards, receive bKash payouts within 24 hours.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkPay BD',
    description: 'Payment links for Bangladeshi freelancers',
  },
}

// Logo Component
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-sm">LP</span>
      </div>
      <span className="font-bold text-xl text-slate-900">LinkPay BD</span>
    </div>
  )
}

// Feature Card Component
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-slate-200">
      <CardHeader className="pb-3">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-600">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

// Testimonial Card Component
function TestimonialCard({
  quote,
  author,
  role,
  location,
}: {
  quote: string
  author: string
  role: string
  location: string
}) {
  return (
    <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <Quote className="w-8 h-8 text-blue-200 mb-3" />
        <p className="text-slate-700 mb-4 leading-relaxed">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {author.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{author}</p>
            <p className="text-slate-500 text-xs">
              {role}, {location}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Pricing Card Component
function PricingCard({
  title,
  price,
  description,
  features,
  isPremium = false,
  ctaText,
}: {
  title: string
  price: string
  description: string
  features: string[]
  isPremium?: boolean
  ctaText: string
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-xl ${
        isPremium ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      {isPremium && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          Popular
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
        <div className="pt-2">
          <span className="text-4xl font-bold text-slate-900">{price}</span>
          {price !== 'Free' && <span className="text-slate-500 ml-1">/month</span>}
        </div>
        <CardDescription className="pt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link href={ctaText === 'Get Started Free' ? '/register' : '/register?plan=premium'}>
          <Button
            className={`w-full ${isPremium ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            variant={isPremium ? 'default' : 'outline'}
          >
            {ctaText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Step Card Component
function StepCard({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg mb-5">
        {number}
      </div>
      <h3 className="font-semibold text-lg text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm max-w-xs leading-relaxed">{description}</p>
    </div>
  )
}

// Stats Counter Component
function StatItem({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="text-center px-4">
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">{value}</div>
      <div className="text-blue-100 text-sm md:text-base">{label}</div>
    </div>
  )
}

// Social Proof Logo
function PartnerLogo({ name, icon: Icon }: { name: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-white/50 rounded-lg">
      <Icon className="w-5 h-5 text-slate-600" />
      <span className="font-medium text-slate-700 text-sm">{name}</span>
    </div>
  )
}

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                FAQ
              </Link>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-600">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button - 44x44px touch target */}
            <MobileMenuClient
              trigger={
                <button
                  className="md:hidden p-3 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              }
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-28 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              <Zap className="w-3 h-3 mr-1" />
              Trusted by 6,500+ Bangladeshi Freelancers
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Get Paid in Minutes,{' '}
              <span className="text-blue-600">Not Weeks.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stop waiting days for international wire transfers. Create a payment link in 30 seconds,
              accept cards from clients worldwide, and receive money in your bKash account within 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg shadow-blue-500/25"
                >
                  Create Free Payment Link
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Lock className="w-4 h-4 text-green-500" />
              <span>Bank-grade security powered by aamarPay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-4 font-medium uppercase tracking-wide">
            Trusted Payment Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <PartnerLogo name="aamarPay" icon={CreditCardIcon} />
            <PartnerLogo name="bKash" icon={Smartphone} />
            <PartnerLogo name="SSL Secured" icon={Shield} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="৳2.5Cr+" label="Processed" />
            <StatItem value="6,500+" label="Freelancers" />
            <StatItem value="4.9/5" label="Rating" />
            <StatItem value="<24hr" label="Payouts" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Get Paid
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Simple, fast, and designed for Bangladeshi freelancers working with international clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Instant Payment Links"
              description="Create in 30 seconds. Share via WhatsApp, email, or any platform your client prefers."
            />
            <FeatureCard
              icon={CreditCard}
              title="Card Payments Accepted"
              description="Accept Visa, Mastercard from clients worldwide. No need for Payoneer or Wise."
            />
            <FeatureCard
              icon={Banknote}
              title="Auto bKash Payout"
              description="Money lands in your bKash or bank account within 24 hours automatically."
            />
            <FeatureCard
              icon={Shield}
              title="Bank-Grade Security"
              description="aamarPay protected. Your money and data are always safe and secure."
            />
            <FeatureCard
              icon={Bell}
              title="Real-time Notifications"
              description="Get instant alerts when clients view or pay your invoices."
            />
            <FeatureCard
              icon={Percent}
              title="Lowest Fees"
              description="Only 0.75% platform fee. Keep more of what you earn."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-slate-600 text-lg">
              Three simple steps to get paid faster
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
            <StepCard
              number={1}
              title="Create Link"
              description="Enter the amount and description. Get your payment link instantly."
            />
            <StepCard
              number={2}
              title="Share Link"
              description="Send via WhatsApp, email, or any platform. Client clicks to pay."
            />
            <StepCard
              number={3}
              title="Get Paid"
              description="Client pays with card. Money arrives to bKash within 24 hours."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Loved by Freelancers
            </h2>
            <p className="text-slate-600 text-lg flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              4.9 out of 5 from 2,400+ reviews
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <TestimonialCard
              quote="Got paid $450 by a US client in just 3 minutes. Used to take 3-5 days with Payoneer!"
              author="Rafiq H."
              role="Web Developer"
              location="Dhaka"
            />
            <TestimonialCard
              quote="Clients take me more seriously now. My own payment page looks so professional."
              author="Najia A."
              role="Brand Designer"
              location="Chattogram"
            />
            <TestimonialCard
              quote="Saved ৳4,500 in fees last month alone compared to Payoneer. LinkPay is a no-brainer."
              author="Tanvir R."
              role="Video Editor"
              location="Sylhet"
            />
            <TestimonialCard
              quote="The tax report feature alone is worth the premium. Makes my NBR compliance so much easier."
              author="Samira I."
              role="Agency Founder"
              location="Dhaka"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              No hidden fees. Pay only when you earn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Free"
              price="Free"
              description="Perfect for getting started"
              features={[
                '0.75% per transaction',
                'Unlimited payment links',
                'Basic dashboard',
                'Email support',
                'Card payments (Visa/Mastercard)',
                'Auto payout to bKash',
              ]}
              ctaText="Get Started Free"
            />
            <PricingCard
              title="Premium"
              price="৳999"
              description="For serious freelancers"
              isPremium
              features={[
                'Everything in Free',
                'Branded payment page',
                'Professional invoice generation',
                'Tax report exports',
                'Priority WhatsApp support',
                'Auto-send via WhatsApp',
                'Multi-user team access',
              ]}
              ctaText="Start Premium Trial"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-lg">
              Everything you need to know about LinkPay BD
            </p>
          </div>

          <FAQAccordion
            items={[
              {
                question: "Is LinkPay legal in Bangladesh?",
                answer: "Yes, LinkPay is fully legal and compliant. We are powered by aamarPay, which is a Bangladesh Bank licensed Payment Service Provider (PSP). All transactions are processed through regulated financial infrastructure."
              },
              {
                question: "How long does payout take?",
                answer: "Once a client completes payment, the money is typically credited to your bKash or bank account within 1-2 business days. In most cases, payouts are processed within 24 hours."
              },
              {
                question: "Which cards can clients use?",
                answer: "Clients can pay using any Visa, Mastercard, or international card. We support cards from all countries, making it easy for your international clients to pay you."
              },
              {
                question: "What fees do I pay?",
                answer: "We charge only 0.75% platform fee per transaction. This includes the aamarPay gateway fee - there are no hidden charges or setup fees."
              },
              {
                question: "Can I receive bKash payment directly?",
                answer: "Yes! When you receive a payment, the amount (minus our small fee) is automatically sent to your registered bKash number. You don't need to do anything."
              },
              {
                question: "How is this better than Payoneer/Wise?",
                answer: "LinkPay offers lower fees (0.75% vs Payoneer's 1-2%), instant link creation (30 seconds vs days of account setup), no minimum thresholds, and direct bKash payout without needing a bank account first."
              }
            ]}
          />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Paid Faster?
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Join 6,500+ Bangladeshi freelancers who trust LinkPay BD for their international payments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 gap-2 shadow-xl"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-white border-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LP</span>
                </div>
                <span className="font-bold text-xl text-white">LinkPay BD</span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm mb-4">
                The simplest payment link platform for Bangladeshi freelancers.
                Get paid faster with professional payment links.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © 2026 LinkPay BD. All rights reserved.
            </p>
            <p className="text-sm text-slate-400">
              Powered by{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                aamarPay
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
