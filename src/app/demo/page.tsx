import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'LinkPay BD Demo Story',
  description: 'A guided visual walkthrough of the LinkPay BD payment link flow.',
}

const demoSteps = [
  {
    title: 'Freelancer creates payment link',
    detail: 'Enter amount, project description, and optional client info in under 30 seconds.',
    icon: '01',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
    time: '30 sec',
  },
  {
    title: 'Share with client instantly',
    detail: 'Send through WhatsApp, Messenger, email, or copy-paste into proposal chat.',
    icon: '02',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
    time: '10 sec',
  },
  {
    title: 'Client pays by card',
    detail: 'Client opens secure checkout and pays using international debit or credit card.',
    icon: '03',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-100',
    time: '1 min',
  },
  {
    title: 'Automatic payout to Bangladesh',
    detail: 'Funds settle and payout can be sent to bKash or bank account with clear fee breakdown.',
    icon: '04',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    time: '24 hrs',
  },
]

const highlights = [
  'Mobile-first checkout and dashboard for Bangladeshi freelancers',
  'Transparent pricing with 0.75% platform fee',
  'Secure payment handling and webhook verification flow',
  'Clear analytics for earnings, fees, and payout status',
]

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">Live Demo Narrative</span>
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">April 2026</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            LinkPay BD Product Demo
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            This page is built for quick stakeholder walkthroughs. It visualizes the exact user journey from
            payment link creation to settlement so you can present value in under 2 minutes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href="/">
                Open Landing Page
                <span className="ml-2">-&gt;</span>
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/dashboard/links/new">Show Create Link Screen</a>
            </Button>
          </div>
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-600">FLOW</span>
            <h2 className="text-xl font-semibold text-slate-900">End-to-End Flow</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {demoSteps.map((step, idx) => {
              return (
                <Card key={step.title} className={`border ${step.bg}`}>
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl bg-white px-2 py-1 text-sm font-semibold shadow-sm ${step.color}`}>
                          {step.icon}
                        </div>
                        <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                          Step {idx + 1}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{step.time}</span>
                    </div>
                    <CardTitle className="text-lg text-slate-900">{step.title}</CardTitle>
                    <CardDescription className="text-slate-600">{step.detail}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mb-10 grid gap-4 lg:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <span className="text-emerald-600">KPI</span>
                Demo KPI Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Links created this week: 127</p>
              <p>Payment success rate: 94.2%</p>
              <p>Average payout completion: 18.6 hrs</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <span className="text-blue-600">SEC</span>
                Trust and Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Webhook signature verification in backend</p>
              <p>Input validation and sanitization for critical APIs</p>
              <p>Role-based admin and dashboard route protections</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <span className="text-amber-600">24H</span>
                Why It Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Freelancers avoid long payment cycles</p>
              <p>Clients pay globally with familiar cards</p>
              <p>Settlement lands locally in Bangladesh</p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">What to emphasize in your boss demo</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item} className="flex gap-2 text-slate-700">
                <span className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600">OK</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">Two-minute talk track</h2>
          <p className="mt-3 max-w-3xl text-slate-200">
            LinkPay BD lets Bangladeshi freelancers create branded payment links in seconds, accept international
            card payments, and receive local payouts with transparent fees and analytics. The core flow is already
            implemented and this demo page visualizes the complete user journey for stakeholders.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              <a href="/">Back to Home</a>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/dashboard/analytics">
                Preview Analytics UI
                <span className="ml-2">-&gt;</span>
              </a>
            </Button>
          </div>
        </section>
      </section>
    </main>
  )
}
