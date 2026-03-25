import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ToastProvider } from '@/components/providers/toast-provider'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, CreditCard, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userInitial = session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'

  return (
    <>
      <ToastProvider />
      <div className="min-h-screen bg-slate-50/50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/60 sticky top-0 z-50 backdrop-blur-sm">
          <nav aria-label="Dashboard navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <span className="font-bold text-lg text-slate-900 hidden sm:block">LinkPay BD</span>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {userInitial}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900">{session.user.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{session.user.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="px-3 py-2 sm:hidden">
                  <p className="font-medium text-sm text-slate-900">{session.user.name || 'User'}</p>
                  <p className="text-xs text-slate-500">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator className="hidden sm:block" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/transactions" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    Transactions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action="/api/auth/signout" method="POST" className="m-0">
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>

        <div className="flex">
          {/* Navigation (Sidebar on desktop, Mobile nav at bottom) */}
          <MobileNav />

          {/* Main Content */}
          <main id="main-content" className="flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
