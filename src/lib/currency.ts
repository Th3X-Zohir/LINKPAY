export const CURRENCY_CONFIG = {
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimals: 2, locale: 'bn-BD' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, locale: 'en-US' },
} as const

export type CurrencyCode = keyof typeof CURRENCY_CONFIG

export function formatCurrency(amount: number, currency: CurrencyCode = 'BDT', showSymbol = true): string {
  const config = CURRENCY_CONFIG[currency]
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)
  return showSymbol ? `${config.symbol}${formatted}` : formatted
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_CONFIG[currency].symbol
}
