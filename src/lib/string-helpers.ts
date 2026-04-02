export function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase())
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str
  return str.slice(0, length - suffix.length) + suffix
}

export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
