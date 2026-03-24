import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ToastProvider } from '@/components/providers/toast-provider'
import Link from 'next/link'
import {
  LayoutDashboard,
  Link as LinkIcon,
  CreditCard,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  ExternalLink
} from 'lucide-react'

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
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <span className="font-bold text-slate-900">LinkPay BD</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{session.user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-sm text-slate-600 hover:text-slate-900">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r min-h-[calc(100vh-57px)] sticky top-[57px] hidden md:block">
            <nav className="p-4 space-y-1">
              <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <SidebarLink href="/dashboard/links" icon={LinkIcon} label="Payment Links" />
              <SidebarLink href="/dashboard/transactions" icon={CreditCard} label="Transactions" />
              <SidebarLink href="/dashboard/payouts" icon={Wallet} label="Payouts" />
              <SidebarLink href="/dashboard/documents" icon={FileText} label="Evidence Vault" />
              <SidebarLink href="/dashboard/disputes" icon={MessageSquare} label="Disputes" />
              <SidebarLink href="/dashboard/analytics" icon={BarChart3} label="Analytics" />
              <SidebarLink href="/dashboard/settings" icon={Settings} label="Settings" />
            </nav>

            {/* Client Portal Section */}
            <div className="p-4 border-t mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portal</p>
              <a
                href="/client/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Client Portal
              </a>
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
            <nav className="flex justify-around p-2">
              <MobileNavLink href="/dashboard" icon={LayoutDashboard} label="Home" />
              <MobileNavLink href="/dashboard/links" icon={LinkIcon} label="Links" />
              <MobileNavLink href="/dashboard/transactions" icon={CreditCard} label="Txns" />
              <MobileNavLink href="/dashboard/payouts" icon={Wallet} label="Payouts" />
              <MobileNavLink href="/dashboard/settings" icon={Settings} label="Settings" />
            </nav>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

function SidebarLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}

function MobileNavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-slate-600 hover:text-blue-600"
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  )
}