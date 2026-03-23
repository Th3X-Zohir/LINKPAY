'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  url: string
  size?: number
}

export function PaymentQRCode({ url, size = 200 }: QRCodeProps) {
  const [mounted, setMounted] = useState(false)
  const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${url}`

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse rounded-lg" />
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm inline-block">
      <QRCodeSVG
        value={fullUrl}
        size={size}
        level="M"
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#0A1628"
      />
    </div>
  )
}
