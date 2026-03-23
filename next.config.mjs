/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdfkit'],
  images: {
    domains: ['sandbox.aamarpay.com', 'aamarpay.com'],
  },
}

export default nextConfig
