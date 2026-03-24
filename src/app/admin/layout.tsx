import { auth } from '@/lib/auth'
import Link from 'next/link'
import { LayoutDashboard, Users, CreditCard, Wallet, BarChart3, LogOut, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email)

  // Show access denied page instead of silent redirect
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600 mb-4">
              You are not authorized to access the admin panel.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Logged in as: <span className="font-mono">{session?.user?.email || 'Unknown'}</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Admin emails: <span className="font-mono text-xs">{adminEmails.join(', ')}</span>
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
              <form action="/api/auth/signout" method="POST">
                <Button type="submit" variant="outline" className="w-full">
                  Sign Out and Login as Admin
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/admin/payouts', label: 'Payouts', icon: Wallet },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LP</span>
                </div>
                <span className="font-bold text-lg">LinkPay Admin</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{session.user?.email}</span>
              <Link
                href="/dashboard"
                className="text-sm text-slate-300 hover:text-white flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Exit Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-slate-800 border-b border-slate-700 overflow-x-auto">
        <div className="flex px-4 py-2 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-2 whitespace-nowrap"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}