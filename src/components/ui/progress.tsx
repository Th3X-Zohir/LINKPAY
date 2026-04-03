'use client'
import { cn } from '@/lib/utils'

interface ProgressProps { value: number; max?: number; className?: string; showLabel?: boolean }
export function Progress({ value, max = 100, className, showLabel }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>
      {showLabel && <p className="text-sm text-muted-foreground mt-1 text-right">{Math.round(percentage)}%</p>}
    </div>
  )
}

interface CircularProgressProps { value: number; max?: number; size?: number; strokeWidth?: number; className?: string }
export function CircularProgress({ value, max = 100, size = 64, strokeWidth = 4, className }: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-primary transition-all duration-300" />
      </svg>
      <span className="absolute text-sm font-medium">{Math.round(percentage)}%</span>
    </div>
  )
}
