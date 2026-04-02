import { z } from 'zod'

export function validateAmount(amount: number): boolean {
  return amount >= 100 && amount <= 10000000
}

export function validatePhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone)
}

export function validateEmail(email: string): boolean {
  try {
    z.string().email().parse(email)
    return true
  } catch {
    return false
  }
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidBdDomain(url: string): boolean {
  try {
    const parsed = new URL(url)
    const bdDomains = ['.bd', '.com.bd', '.org.bd', '.net.bd', '.gov.bd']
    return bdDomains.some(domain => parsed.hostname.endsWith(domain)) || parsed.hostname === 'localhost'
  } catch {
    return false
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
