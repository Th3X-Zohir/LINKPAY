/**
 * Unified Payment Gateway Interface
 * Supports both aamarPay and SSLCommerz
 */

import { createAamarPayPayment, verifyAamarPayPayment, type AamarPayPaymentResponse } from './aamarPay'
import { createSSLCommerzPayment, verifySSLCommerzPayment, type SSLCommerzPaymentResponse } from './sslcommerz'

export type PaymentGateway = 'aamarpay' | 'sslcommerz'

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
 * Create a payment using the specified gateway
 */
export async function createPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const gateway = request.gateway || 'aamarpay'

  if (gateway === 'sslcommerz') {
    const result: SSLCommerzPaymentResponse = await createSSLCommerzPayment(request)
    
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
      paymentId: result.sessionkey,
      paymentUrl: result.storeRedirectUrl || result.gatewayUrl
    }
  }

  // Default to aamarpay
  const result: AamarPayPaymentResponse = await createAamarPayPayment(request)
  
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
 * Verify a payment with the specified gateway
 */
export async function verifyPayment(paymentId: string, gateway: PaymentGateway): Promise<boolean> {
  if (gateway === 'sslcommerz') {
    const result = await verifySSLCommerzPayment(paymentId, '')
    return result.valid
  }

  return verifyAamarPayPayment(paymentId)
}

/**
 * Get the appropriate webhook URL for a gateway
 */
export function getWebhookUrl(gateway: PaymentGateway): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (gateway === 'sslcommerz') {
    return `${baseUrl}/api/webhooks/sslcommerz`
  }
  
  return `${baseUrl}/api/webhooks/aamarpay`
}
