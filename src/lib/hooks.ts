'use client'
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue }
    catch { return initialValue }
  })
  const setValue = (value: T) => {
    try { setStoredValue(value); window.localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }
  return [storedValue, setValue]
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia(query); setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener); return () => media.removeEventListener('change', listener)
  }, [query])
  return matches
}

export function useIsMobile() { return useMediaQuery('(max-width: 768px)') }
export function useIsDesktop() { return useMediaQuery('(min-width: 1024px)') }
