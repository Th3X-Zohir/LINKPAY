export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
}

export function generateMetaTags(config: SEOConfig): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(', ') || '',
    'og:title': config.title,
    'og:description': config.description,
    'og:image': config.image || `${baseUrl}/og-image.png`,
    'og:url': config.url || baseUrl,
    'og:type': config.type || 'website',
    'twitter:card': 'summary_large_image',
  }
}

export function formatPageTitle(title: string, siteName = 'LinkPay BD'): string {
  return `${title} | ${siteName}`
}

export function generateCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return `${baseUrl}${path}`
}
