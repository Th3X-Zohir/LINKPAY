import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdfkit'],
  images: {
    domains: ['sandbox.aamarpay.com', 'aamarpay.com'],
  }
}

export default nextConfig
