'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Share2, Copy, Check, MessageCircle, Mail, ExternalLink, QrCode } from 'lucide-react'

interface ShareMenuProps {
  url: string
  description?: string
  amount?: string
}

export function ShareMenu({ url, description, amount }: ShareMenuProps) {
  const [copied, setCopied] = useState(false)

  const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${url}`
  const shareText = description
    ? `Pay ${amount || ''} for ${description}: ${fullUrl}`
    : `Pay here: ${fullUrl}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const emailUrl = `mailto:?subject=Payment Request&body=${encodeURIComponent(shareText)}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={emailUrl} target="_blank" rel="noopener noreferrer">
            <Mail className="w-4 h-4 mr-2" /> Email
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" /> Open Page
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
