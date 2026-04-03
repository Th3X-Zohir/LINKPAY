export const MIN_PAYMENT_AMOUNT = 100
export const MAX_PAYMENT_AMOUNT = 10000000
export const DEFAULT_LINK_EXPIRY_DAYS = 30

export const MIN_PAYOUT_AMOUNT = 500
export const MAX_PAYOUT_AMOUNT = 5000000

export const PLATFORM_FEE_PERCENT = 0.75
export const AAMARPAY_FEE_PERCENT = 2

export const SERVICE_CATEGORIES = {
  WEB_DEVELOPMENT: 'Web Development',
  GRAPHIC_DESIGN: 'Graphic Design',
  DATA_ENTRY: 'Data Entry',
  CONSULTING: 'Consulting',
  COPYWRITING: 'Copywriting',
  VIDEO_EDITING: 'Video Editing',
  SOCIAL_MEDIA: 'Social Media',
  TRANSLATION: 'Translation',
  OTHER: 'Other',
} as const

export const DISPUTE_REASONS = {
  CLIENT_NOT_PAID: 'Client did not pay',
  SERVICE_NOT_DELIVERED: 'Service not delivered',
  OVERCHARGED: 'Overcharged amount',
  DUPLICATE_CHARGE: 'Duplicate charge',
  UNAUTHORIZED_CHARGE: 'Unauthorized charge',
  OTHER: 'Other reason',
} as const

export const PAYMENT_METHODS = {
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  BANK: 'Bank Transfer',
  CARD: 'Card Payment',
} as const

export const PAYOUT_METHODS = {
  BKASH: 'bKash',
  BANK: 'Bank Transfer',
} as const

export const BANK_LIST = {
  DBBL: 'Dutch-Bangla Bank',
  BRAC: 'BRAC Bank',
  CITY: 'City Bank',
  EBL: 'Eastern Bank',
  HSBC: 'HSBC',
  STANDARD_CHARTERED: 'Standard Chartered',
  TRUST_BANK: 'Trust Bank',
  ISLAMI_BANK: 'Islami Bank',
  DUTCH_BANGLA: 'Dutch-Bangla Bank',
  BANK_ASIA: 'Bank Asia',
  MIDLAND_BANK: 'Midland Bank',
  NRB_BANK: 'NRB Bank',
} as const
