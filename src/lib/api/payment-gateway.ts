/**
 * Unified Payment Gateway Interface
 * Supports aamarPay and SSLCommerz
 */

import { createAamarPayPayment, verifyAamarPayPayment, AamarPayPaymentResponse } from './aamarPay'
import {
  createSSLCommerzPayment,
  verifySSLCommerzPayment,
  SSLCommerzPaymentResponse
} from './sslcommerz'

export type PaymentGateway = 'aamarpay' | 'sslcommerz'

// Re-export payment response types
export type { AamarPayPaymentResponse, SSLCommerzPaymentResponse }

export interface PaymentRequest {
  amount: number
  description: string
  customerName: string
  customerEmail: string
  customerMobile: string
  successUrl: string
  failUrl: string
  cancelUrl: string
  gateway?: PaymentGateway
}

export interface PaymentResponse {
  success: boolean
  gateway: PaymentGateway
  paymentId?: string
  paymentUrl?: string
  error?: string
}

/**
 * Create a payment using the specified or default gateway
 */
export async function createPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const gateway = request.gateway || 'aamarpay'

  if (gateway === 'sslcommerz') {
    return createSSLCommerzPaymentGateway(request)
  }

  return createAamarPayPaymentGateway(request)
}

/**
 * Create payment via aamarPay
 */
async function createAamarPayPaymentGateway(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const result = await createAamarPayPayment(request)

  if (result.status === 'fail') {
    return {
      success: false,
      gateway: 'aamarpay',
      error: result.error
    }
  }

  return {
    success: true,
    gateway: 'aamarpay',
    paymentId: result.payment_id,
    paymentUrl: result.payment_url
  }
}

/**
 * Create payment via SSLCommerz
 */
async function createSSLCommerzPaymentGateway(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const result = await createSSLCommerzPayment(request)

  if (result.status === 'fail') {
    return {
      success: false,
      gateway: 'sslcommerz',
      error: result.error
    }
  }

  return {
    success: true,
    gateway: 'sslcommerz',
    paymentId: result.tranId,
    paymentUrl: result.paymentUrl
  }
}

/**
 * Verify a payment with the specified gateway
 */
export async function verifyPayment(paymentId: string, gateway: PaymentGateway = 'aamarpay'): Promise<boolean> {
  if (gateway === 'sslcommerz') {
    const result = await verifySSLCommerzPayment(paymentId)
    return result?.status === 'VALID'
  }

  return verifyAamarPayPayment(paymentId)
}

/**
 * Get the webhook URL for the specified gateway
 */
export function getWebhookUrl(gateway: PaymentGateway = 'aamarpay'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (gateway === 'sslcommerz') {
    return `${baseUrl}/api/webhooks/sslcommerz`
  }

  return `${baseUrl}/api/webhooks/aamarpay`
}