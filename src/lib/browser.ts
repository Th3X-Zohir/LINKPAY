export function isBrowser(): boolean { return typeof window !== 'undefined' }
export function isServer(): boolean { return typeof window === 'undefined' }
export function isMobile(): boolean {
  if (!isBrowser()) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
export function isDarkMode(): boolean {
  if (!isBrowser()) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
export function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false)
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
}
export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
  if (!isBrowser()) return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}
