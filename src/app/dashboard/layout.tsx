import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ToastProvider } from '@/components/providers/toast-provider'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <>
      <ToastProvider />
      <div className="min-h-screen bg-slate-100">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <nav aria-label="Dashboard navigation" className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <span className="font-bold text-slate-900">LinkPay BD</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{session.user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" aria-label="Sign out" className="text-sm text-slate-600 hover:text-slate-900">
                  Sign Out
                </button>
              </form>
            </div>
          </nav>
        </header>

        <div className="flex">
          {/* Navigation (Sidebar on desktop, Mobile nav at bottom) */}
          <MobileNav />

          {/* Main Content */}
          <main id="main-content" className="flex-1 p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}