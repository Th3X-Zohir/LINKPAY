'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Link as LinkIcon,
  CreditCard,
  ArrowUpRight,
  Settings,
  FileText,
  MessageSquare,
  BarChart3,
  Shield,
  ExternalLink,
  Home,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/links', label: 'Links', icon: LinkIcon },
  { href: '/dashboard/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/dashboard/payouts', label: 'Payouts', icon: ArrowUpRight },
]

const toolsNavItems = [
  { href: '/dashboard/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/disputes', label: 'Disputes', icon: MessageSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

const bottomNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/links', label: 'Links', icon: LinkIcon },
  { href: '/dashboard/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/dashboard/payouts', label: 'Payouts', icon: ArrowUpRight },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function SidebarLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white font-medium shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
      {label}
    </Link>
  )
}

export function MobileNav() {
  const pathname = usePathname()
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
    <>
      {/* Desktop Sidebar - shows ALL navigation items */}
      <aside className="hidden md:block w-64 bg-white border-r min-h-screen sticky top-0">
        <div className="p-4">
          {/* Main Navigation */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Main Menu</p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Tools Navigation */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Tools</p>
            <nav className="space-y-1">
              {toolsNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Settings */}
          <div className="mb-6">
            <nav className="space-y-1">
              <SidebarLink href="/dashboard/settings" icon={Settings} label="Settings" />
            </nav>
          </div>

          {/* Admin Section */}
          {adminChecked && isAdmin && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 px-3">Admin</p>
              <nav className="space-y-1">
                <SidebarLink href="/admin" icon={Shield} label="Admin Panel" />
              </nav>
            </div>
          )}

          {/* Client Portal Section */}
          <div className="pt-4 border-t border-slate-100">
            <a
              href="/client"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              Client Portal
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/60 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {bottomNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-slate-400 hover:text-slate-600 transition-colors">
                <div className="p-1.5 rounded-xl">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mb-2">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/documents" className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Documents
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/disputes" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500" /> Disputes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-500" /> Analytics
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  )
}
