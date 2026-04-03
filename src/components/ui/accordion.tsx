'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionItemProps { title: string; content: React.ReactNode; defaultOpen?: boolean }
export function AccordionItem({ title, content, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="font-medium">{title}</span>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-200', isOpen ? 'max-h-screen pb-4' : 'max-h-0')}>
        <div className="text-muted-foreground">{content}</div>
      </div>
    </div>
  )
}

interface AccordionProps { items: { title: string; content: React.ReactNode }[]; defaultOpenIndex?: number; className?: string }
export function Accordion({ items, defaultOpenIndex, className }: AccordionProps) {
  return (
    <div className={cn('divide-y divide-gray-200', className)}>
      {items.map((item, index) => <AccordionItem key={index} title={item.title} content={item.content} defaultOpen={index === defaultOpenIndex} />)}
    </div>
  )
}
