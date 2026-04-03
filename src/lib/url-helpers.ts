export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.set(key, String(value))
  })
  return searchParams.toString()
}

export function parseQueryString(query: string): Record<string, string> {
  const params = new URLSearchParams(query)
  const result: Record<string, string> = {}
  params.forEach((value, key) => { result[key] = value })
  return result
}

export function isValidUrl(url: string): boolean {
  try { new URL(url); return true } catch { return false }
}

export function getDomainFromUrl(url: string): string {
  try { return new URL(url).hostname } catch { return '' }
}

export function removeTrailingSlash(url: string): string { return url.replace(/\/+$/, '') }
export function addTrailingSlash(url: string): string { return url.endsWith('/') ? url : `${url}/` }
