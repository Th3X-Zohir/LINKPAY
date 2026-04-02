export const FEATURE_FLAGS = {
  PAYOUT_ENABLED: process.env.NEXT_PUBLIC_FEATURE_PAYOUT === 'true',
  DISPUTE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DISPUTE === 'true',
  INVOICE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_INVOICE === 'true',
  REFERRAL_ENABLED: process.env.NEXT_PUBLIC_FEATURE_REFERRAL === 'true',
  PREMIUM_FEATURES: process.env.NEXT_PUBLIC_FEATURE_PREMIUM === 'true',
  DARK_MODE: process.env.NEXT_PUBLIC_FEATURE_DARK_MODE === 'true',
  ANALYTICS: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true',
  MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
} as const

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] ?? false
}
