import { z } from 'zod'

const envSchema = z.object({
  // Required for production
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional().or(z.literal('')),

  // Encryption key for NID/TIN (32 bytes hex = 64 chars, or base64, or raw string)
  ENCRYPTION_KEY: z.string().min(1),

  // Optional but recommended
  RESEND_API_KEY: z.string().optional(),
  AAMARPAY_STORE_ID: z.string().optional(),
  AAMARPAY_KEY: z.string().optional(),
  AAMARPAY_URL: z.string().optional(),
  WEBAUTHN_RP_ID: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
})

let validated = false
let envCache: z.infer<typeof envSchema> | null = null

/**
 * Validate environment variables on startup
 * Call this function early in the application lifecycle
 * @throws Error if required env vars are missing
 */
export function validateEnv(): z.infer<typeof envSchema> {
  if (validated && envCache) {
    return envCache
  }

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.errors
      .filter(e => e.code === 'invalid_type' || e.code === 'too_small')
      .map(e => e.path.join('.'))
      .join(', ')

    const errorMsg = `Missing or invalid environment variables: ${missing}\n\n` +
      'Required variables:\n' +
      '  - DATABASE_URL (PostgreSQL connection string)\n' +
      '  - NEXTAUTH_SECRET (min 32 characters)\n' +
      '  - ENCRYPTION_KEY (for NID/TIN encryption)\n\n' +
      'Please set these in your .env file or environment.'

    console.error(errorMsg)

    // In development, show a more helpful error
    if (process.env.NODE_ENV === 'development') {
      throw new Error(errorMsg)
    }

    // In production, don't expose details but fail fast
    throw new Error('Server configuration error. Check environment variables.')
  }

  validated = true
  envCache = result.data
  return result.data
}

/**
 * Get a specific env var with validation
 */
export function getEnvVar<K extends keyof z.infer<typeof envSchema>>(
  key: K,
  fallback?: string
): string {
  const env = validateEnv()
  return (env[key] as string) || fallback || ''
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}
