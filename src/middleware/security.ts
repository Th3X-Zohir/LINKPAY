import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security headers to apply to all responses.
 */
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'payment=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.aamarpay.com https://*.bkash.com https://sandbox.sslcommerz.com https://securepay.sslcommerz.com",
}

/**
 * Apply security headers to a response.
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  const newResponse = new NextResponse(response.body, response)

  for (const [key, value] of Object.entries(securityHeaders)) {
    newResponse.headers.set(key, value)
  }

  return newResponse
}

/**
 * Create a response with security headers already applied.
 */
export function createSecureResponse(
  body: string | object,
  init?: ResponseInit
): NextResponse {
  const response =
    typeof body === 'string'
      ? new NextResponse(body, init)
      : NextResponse.json(body, init)

  return withSecurityHeaders(response)
}

/**
 * Validate that a request origin is allowed.
 * Useful for CSRF protection on state-changing operations.
 */
export function isValidOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin')

  if (!origin) {
    // No origin header - could be a server-side request
    return true
  }

  return allowedOrigins.some(
    (allowed) => allowed === origin || origin.startsWith(allowed + '/')
  )
}

/**
 * Get the client IP from a request.
 */
export function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return undefined
}
