import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  CreditCard,
  Smartphone,
  Shield,
  Zap,
  Check,
  Star,
  Quote,
  Lock,
  Bell,
  Percent,
  Banknote,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  BadgeCheck,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { MobileMenuClient } from './MobileMenuClient'
import { FAQAccordion } from './FAQAccordion'
import { NewsletterForm } from '@/components/NewsletterForm'

// SEO Metadata with enhanced Open Graph and structured data
export const metadata = {
  title: 'LinkPay BD - Get Paid in Minutes, Not Weeks',
  description: 'Create payment links in 30 seconds, accept international cards, receive bKash payouts within 24 hours. Only 0.75% platform fee.',
  keywords: ['payment links', 'bKash', 'freelancer', 'Bangladesh', 'international payments', 'aamarPay', 'online payment BD'],
  authors: [{ name: 'LinkPay BD' }],
  openGraph: {
    title: 'LinkPay BD - Get Paid in Minutes, Not Weeks',
    description: 'Create payment links in 30 seconds, accept international cards, receive bKash payouts within 24 hours.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    url: 'https://linkpay.bd',
    siteName: 'LinkPay BD',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'LinkPay BD - Payment Links for Bangladeshi Freelancers'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkPay BD',
    description: 'Payment links for Bangladeshi freelancers',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// JSON-LD Structured Data for Organization and Service
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://linkpay.bd/#organization',
      name: 'LinkPay BD',
      url: 'https://linkpay.bd',
      logo: 'https://linkpay.bd/logo.png',
      sameAs: [
        'https://facebook.com/linkpaybd',
        'https://twitter.com/linkpaybd',
        'https://linkedin.com/company/linkpaybd',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+880-1700-000000',
        contactType: 'customer service',
        availableLanguage: ['English', 'Bengali'],
        areaServed: 'BD',
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'House 12, Road 5, Dhanmondi',
        addressLocality: 'Dhaka',
        addressRegion: 'Dhaka',
        postalCode: '1205',
        addressCountry: 'BD',
      },
    },
    {
      '@type': 'Service',
      '@id': 'https://linkpay.bd/#service',
      name: 'LinkPay BD Payment Links',
      description: 'Create payment links in 30 seconds, accept international cards, receive bKash payouts within 24 hours.',
      provider: { '@id': 'https://linkpay.bd/#organization' },
      areaServed: 'BD',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Payment Plans',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Free Plan',
            },
            price: '0',
            priceCurrency: 'BDT',
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Premium Plan',
            },
            price: '999',
            priceCurrency: 'BDT',
          },
        ],
      },
    },
  ],
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

// Floating Payment Icon Component
function FloatingIcon({ icon: Icon, className, style }: { icon: React.ElementType; className: string; style?: React.CSSProperties }) {
  return (
    <div className={`absolute ${className}`} style={style}>
      <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce border border-slate-100" style={{ animationDuration: '3s' }}>
        <Icon className="w-7 h-7 text-blue-600" />
      </div>
    </div>
  )
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <span className="tabular-nums">
      {value}
      {suffix}
    </span>
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
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 hover:border-blue-200">
      <CardHeader className="pb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-600 leading-relaxed">{description}</CardDescription>
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
  rating = 5,
}: {
  quote: string
  author: string
  role: string
  location: string
  rating?: number
}) {
  return (
    <Card className="bg-white border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="pt-6">
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
            />
          ))}
        </div>
        <Quote className="w-8 h-8 text-blue-200 mb-3" />
        <p className="text-slate-700 mb-4 leading-relaxed">&quot;{quote}&quot;</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {author.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{author}</p>
            <p className="text-slate-500 text-xs">
              {role} · {location}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Pricing Card Component with enhanced animations
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
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 group ${
        isPremium ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'
      }`}
    >
      {isPremium && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-center py-2 text-sm font-semibold">
          <BadgeCheck className="w-4 h-4 inline mr-1" />
          Most Popular
        </div>
      )}
      <CardHeader className={`pb-4 ${isPremium ? 'pt-10' : ''}`}>
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
        <div className="pt-2">
          <span className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
            {price}
          </span>
          {price !== 'Free' && <span className="text-slate-500 ml-1">/month</span>}
        </div>
        <CardDescription className="pt-2 font-medium">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link href={ctaText === 'Get Started Free' ? '/register' : '/register?plan=premium'}>
          <Button
            className={`w-full transition-all duration-300 ${
              isPremium 
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30' 
                : ''
            }`}
            variant={isPremium ? 'default' : 'outline'}
            size="lg"
          >
            {ctaText}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Step Card Component with connector line
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
    <div className="relative flex flex-col items-center text-center group">
      <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
        {number}
        {number < 3 && (
          <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
        )}
      </div>
      <h3 className="font-semibold text-lg text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm max-w-xs leading-relaxed">{description}</p>
    </div>
  )
}

// Stats Counter Component with animation
function StatItem({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="text-center px-4 group">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2 transition-transform duration-300 group-hover:scale-105">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-blue-100 text-sm md:text-base font-medium">{label}</div>
    </div>
  )
}

// Social Proof Logo with hover effect
function PartnerLogo({ name, icon: Icon }: { name: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur rounded-xl hover:bg-white/80 transition-all duration-300 border border-slate-100 hover:border-slate-200 hover:shadow-md">
      <Icon className="w-6 h-6 text-slate-600" />
      <span className="font-semibold text-slate-700 text-sm">{name}</span>
    </div>
  )
}

// Security Badge Component
function SecurityBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
      <Icon className="w-4 h-4 text-green-600" />
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  )
}

// Trusted Company Logo
function TrustedLogo({ name, width = 100 }: { name: string; width?: number }) {
  return (
    <div 
      className="flex items-center justify-center px-8 py-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
      style={{ minWidth: width }}
    >
      <span className="font-bold text-xl text-slate-400 hover:text-slate-700 transition-colors">{name}</span>
    </div>
  )
}

// Chat Widget Button Component
function ChatWidget() {
  return (
    <button
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Open live chat"
    >
      <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Chat with us
      </span>
    </button>
  )
}

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      {/* Hero Section with Animated Gradient */}
      <section className="relative py-16 md:py-28 lg:py-32 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
        
        {/* Floating payment method icons */}
        <FloatingIcon icon={Smartphone} className="top-20 left-[10%] hidden lg:flex" />
        <FloatingIcon icon={CreditCard} className="top-32 right-[15%] hidden lg:flex" style={{ animationDelay: '0.5s' }} />
        <FloatingIcon icon={Banknote} className="bottom-32 left-[20%] hidden lg:flex" style={{ animationDelay: '1s' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-blue-150 transition-all duration-300 px-4 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Trusted by 6,500+ Bangladeshi Freelancers
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Get Paid in Minutes,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Not Weeks.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stop waiting days for international wire transfers. Create a payment link in 30 seconds,
              accept cards from clients worldwide, and receive money in your bKash account within 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                  Create Free Payment Link
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2 hover:bg-slate-50 transition-colors"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Bank-grade security</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>aamarPay Protected</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full">
                <BadgeCheck className="w-4 h-4 text-purple-500" />
                <span>0.75% lowest fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-4 font-medium uppercase tracking-wide">
            Secured & Trusted By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <SecurityBadge icon={Shield} label="256-bit SSL" />
            <SecurityBadge icon={ShieldCheck} label="PCI DSS" />
            <SecurityBadge icon={Lock} label="GDPR Compliant" />
            <SecurityBadge icon={BadgeCheck} label="BD Bank Licensed" />
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-4 font-medium uppercase tracking-wide">
            Payment Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <PartnerLogo name="aamarPay" icon={CreditCard} />
            <PartnerLogo name="bKash" icon={Smartphone} />
            <PartnerLogo name="Visa" icon={CreditCard} />
            <PartnerLogo name="Mastercard" icon={CreditCard} />
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

      {/* Trusted By / Company Logos */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-8 font-medium uppercase tracking-wide">
            Trusted by freelancers at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <TrustedLogo name="Upwork" />
            <TrustedLogo name="Fiverr" />
            <TrustedLogo name="Freelancer" />
            <TrustedLogo name="Toptal" />
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
              },
              {
                question: "Is my data secure?",
                answer: "Absolutely. We use 256-bit SSL encryption, are PCI DSS compliant, and never store your card details. All payment data is handled by aamarPay's secure infrastructure."
              },
              {
                question: "What if a client disputes a payment?",
                answer: "We have a dedicated dispute resolution team. While disputes are rare (less than 0.1% of transactions), we provide full documentation support and work with both parties to resolve issues fairly."
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

      {/* Footer with Enhanced Links */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LP</span>
                </div>
                <span className="font-bold text-xl text-white">LinkPay BD</span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm mb-4 leading-relaxed">
                The simplest payment link platform for Bangladeshi freelancers.
                Get paid faster with professional payment links.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="w-4 h-4" />
                  <span>+880 1700-000000</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span>support@linkpay.bd</span>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#features" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="border-t border-slate-800 pt-8 mb-8">
            <div className="max-w-md mx-auto text-center">
              <h4 className="font-semibold text-white mb-2">Stay Updated</h4>
              <p className="text-slate-400 text-sm mb-4">Get the latest features and tips delivered to your inbox.</p>
              <NewsletterForm />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              <p>© 2026 LinkPay BD. All rights reserved.</p>
              <p className="mt-1">Powered by <span className="text-blue-400">aamarPay</span> • Made with ❤️ in Bangladesh</p>
            </div>
            <div className="flex items-center gap-4">
              <Image src="/ssl-secure.png" alt="SSL Secured" width={32} height={32} className="h-8 opacity-50 hover:opacity-100 transition-opacity" loading="lazy" />
              <Image src="/pci-compliant.png" alt="PCI Compliant" width={32} height={32} className="h-8 opacity-50 hover:opacity-100 transition-opacity" loading="lazy" />
            </div>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <ChatWidget />
    </div>
  )
}
