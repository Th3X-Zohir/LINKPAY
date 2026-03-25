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
      <div className="min-h-screen bg-slate-50/50">
        <div className="flex max-w-7xl mx-auto">
          {/* Navigation (Sidebar on desktop, Mobile nav at bottom) */}
          <MobileNav />

          {/* Main Content */}
          <main id="main-content" className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 lg:pl-0">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
