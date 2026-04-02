import { PLATFORM_FEE_PERCENT, AAMARPAY_FEE_PERCENT } from './constants'

export interface FeeBreakdown {
  amount: number
  platformFee: number
  aamarpayFee: number
  totalFees: number
  netAmount: number
}

export function calculateFees(amount: number): FeeBreakdown {
  const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100))
  const aamarpayFee = Math.round(amount * (AAMARPAY_FEE_PERCENT / 100))
  const totalFees = platformFee + aamarpayFee
  const netAmount = amount - totalFees

  return { amount, platformFee, aamarpayFee, totalFees, netAmount }
}

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * (PLATFORM_FEE_PERCENT / 100))
}

export function calculateAamarpayFee(amount: number): number {
  return Math.round(amount * (AAMARPAY_FEE_PERCENT / 100))
}

export function getNetAmount(amount: number): number {
  const fees = calculateFees(amount)
  return fees.netAmount
}
