'use client'

import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

export function NewsletterForm() {
  return (
    <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        placeholder="Enter your email"
        className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0"
        aria-label="Email for newsletter"
      />
      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 px-4">
        <Send className="w-4 h-4" />
      </Button>
    </form>
  )
}
