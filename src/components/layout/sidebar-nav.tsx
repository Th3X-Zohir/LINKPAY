'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Link as LinkIcon,
  CreditCard,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  ExternalLink,
  Shield,
  MoreHorizontal
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)

  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.isAdmin)
        setAdminChecked(true)
      })
      .catch(() => {
        setAdminChecked(true)
      })
  }, [])

  return (
    <aside className="w-64 bg-white border-r min-h-screen sticky top-0 hidden md:block">
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

      {/* Admin Section */}
      {adminChecked && isAdmin && (
        <div className="p-4 border-t mt-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Admin</p>
          <SidebarLink href="/admin" icon={Shield} label="Admin Panel" />
        </div>
      )}

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

// Mobile navigation items
const mobileNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/links', icon: LinkIcon, label: 'Links' },
  { href: '/dashboard/transactions', icon: CreditCard, label: 'Txns' },
  { href: '/dashboard/payouts', icon: Wallet, label: 'Payouts' },
]

const moreNavItems = [
  { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
  { href: '/dashboard/disputes', icon: MessageSquare, label: 'Disputes' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe">
      <nav className="flex justify-around items-center py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs min-w-[64px] ${
                isActive ? 'text-blue-600' : 'text-slate-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* More dropdown for additional items */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Link
              href="#"
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs min-w-[64px] text-slate-600 hover:text-blue-600 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>More</span>
            </Link>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mb-2">
            {moreNavItems.map((item) => {
              const Icon = item.icon
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  )
}