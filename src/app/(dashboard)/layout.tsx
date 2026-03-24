import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { MobileNav } from '@/components/layout/sidebar-nav'

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
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LP</span>
            </div>
            <span className="font-bold text-slate-900">LinkPay BD</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:inline">{session.user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
