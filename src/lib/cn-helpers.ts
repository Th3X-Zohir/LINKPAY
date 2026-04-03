import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) { return clsx(inputs) }

export function getInitials(name: string): string {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

export function isValidJSON(str: string): boolean {
  try { JSON.parse(str); return true } catch { return false }
}

export function sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)) }

export function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return fn().catch(err => {
    if (retries <= 0) throw err
    return sleep(delay).then(() => retry(fn, retries - 1, delay * 2))
  })
}
