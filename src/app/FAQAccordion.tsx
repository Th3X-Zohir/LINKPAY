'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItemProps {
  question: string
  answer: string
}

interface FAQAccordionProps {
  items: FAQItemProps[]
}

function FAQAccordionItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const toggleOpen = () => setIsOpen(!isOpen)

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-slate-900 pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
            prefersReducedMotion ? '' : isOpen ? 'rotate-180' : ''
          }`}
          style={{
            transition: prefersReducedMotion ? 'none' : 'transform 200ms ease-in-out',
          }}
        />
      </button>
      <div
        className="overflow-hidden"
        style={{
          transition: prefersReducedMotion ? 'none' : 'max-height 200ms ease-in-out, padding 200ms ease-in-out',
          maxHeight: isOpen ? '384px' : '0',
          paddingBottom: isOpen ? '16px' : '0',
        }}
      >
        <p className="text-slate-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 md:px-6">
      {items.map((item, index) => (
        <FAQAccordionItem key={index} question={item.question} answer={item.answer} />
      ))}
    </div>
  )
}
