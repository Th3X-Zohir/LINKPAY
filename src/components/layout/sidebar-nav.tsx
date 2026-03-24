'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

function SidebarLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium'
          : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}

export function SidebarNav() {
  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-57px)] sticky top-[57px] hidden md:block">
      <nav className="p-4 space-y-1">
        <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <SidebarLink href="/dashboard/links" icon={LinkIcon} label="Payment Links" />
        <SidebarLink href="/dashboard/transactions" icon={CreditCard} label="Transactions" />
        <SidebarLink href="/dashboard/payouts" icon={Wallet} label="Payouts" />
        <SidebarLink href="/dashboard/documents" icon={FileText} label="Documents" />
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
  )
}

export function MobileNav() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/dashboard/links', icon: LinkIcon, label: 'Links' },
    { href: '/dashboard/transactions', icon: CreditCard, label: 'Txns' },
    { href: '/dashboard/payouts', icon: Wallet, label: 'Payouts' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <nav className="flex justify-around p-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                isActive ? 'text-blue-600' : 'text-slate-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}