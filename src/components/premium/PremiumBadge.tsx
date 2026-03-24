'use client'

import { Crown } from 'lucide-react'

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

const PREMIUM_BENEFITS = [
  'Unlimited payment links',
  'Custom branded invoices',
  'Priority support',
  'Advanced analytics',
  'No platform fee watermark'
]

export function PremiumBadge({ size = 'sm', showTooltip = true }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div className="relative inline-block group">
      <span
        className={`
          inline-flex items-center gap-1 font-semibold rounded-full
          bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600
          text-white shadow-sm
          ${sizeClasses[size]}
        `}
      >
        <Crown className={`${iconSizes[size]} text-amber-600`} />
        <span>PREMIUM</span>
      </span>

      {showTooltip && (
        <div className="
          absolute left-0 top-full mt-2 z-50
          w-64 p-3 rounded-lg bg-slate-900 text-white text-xs
          shadow-xl border border-slate-700
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200
          before:content-[''] before:absolute before:left-4 before:top-0
          before:-translate-y-full before:border-8 before:border-transparent
          before:border-b-slate-900
        ">
          <p className="font-semibold mb-2 text-amber-400">Premium Benefits:</p>
          <ul className="space-y-1">
            {PREMIUM_BENEFITS.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
