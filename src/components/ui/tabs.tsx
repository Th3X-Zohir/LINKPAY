'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsProps { tabs: { id: string; label: string; content: React.ReactNode }[]; defaultTab?: string; className?: string }
export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  return (
    <div className={className}>
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">{tabs.find(tab => tab.id === activeTab)?.content}</div>
    </div>
  )
}
