'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-sm">LP</span>
      </div>
      <span className="font-bold text-xl text-slate-900">LinkPay BD</span>
    </div>
  )
}

interface MobileMenuClientProps {
  trigger: React.ReactNode
}

export function MobileMenuClient({ trigger }: MobileMenuClientProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => setIsOpen(false)

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={handleClose}>
          <div className="bg-white w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <button
                onClick={handleClose}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              <Link href="#features" onClick={handleClose} className="text-slate-600 hover:text-slate-900 py-2">
                Features
              </Link>
              <Link href="#pricing" onClick={handleClose} className="text-slate-600 hover:text-slate-900 py-2">
                Pricing
              </Link>
              <Link href="#faq" onClick={handleClose} className="text-slate-600 hover:text-slate-900 py-2">
                FAQ
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t">
                <Link href="/login">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
