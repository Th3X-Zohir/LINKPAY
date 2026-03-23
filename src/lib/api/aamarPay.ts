const AAMARPAY_URL = process.env.AAMARPAY_URL || 'https://sandbox.aamarpay.com'
const STORE_ID = process.env.AAMARPAY_STORE_ID
const SIGNATURE_KEY = process.env.AAMARPAY_SIGNATURE_KEY
const API_KEY = process.env.AAMARPAY_KEY

interface AamarPayPaymentRequest {
  amount: number
  description: string
  customerName: string
  customerEmail: string
  customerMobile: string
  paymentUrl?: string
  successUrl: string
  failUrl: string
  cancelUrl: string
}

interface AamarPayPaymentResponse {
  status: 'success' | 'fail'
  payment_id?: string
  payment_url?: string
  execute_url?: string
  error?: string
}

export async function createAamarPayPayment(request: AamarPayPaymentRequest): Promise<AamarPayPaymentResponse> {
  try {
    const payload = {
      store_id: STORE_ID,
      signature_key: SIGNATURE_KEY,
      api_key: API_KEY,
      amount: request.amount,
      description: request.description,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_mobile: request.customerMobile,
      payment_url: request.paymentUrl || '',
      success_url: request.successUrl,
      fail_url: request.failUrl,
      cancel_url: request.cancelUrl
    }

    const response = await fetch(`${AAMARPAY_URL}/api/v1/trxbot/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.result !== 'true' && data.result !== true) {
      return { status: 'fail', error: data.error_message || 'Payment initiation failed' }
    }

    return {
      status: 'success',
      payment_id: data.payment_id,
      payment_url: data.payment_url,
      execute_url: data.execute_url
    }
  } catch (error) {
    console.error('aamarPay error:', error)
    return { status: 'fail', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function verifyAamarPayPayment(paymentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${AAMARPAY_URL}/api/v1/trxbot/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        store_id: STORE_ID,
        signature_key: SIGNATURE_KEY,
        payment_id: paymentId
      })
    })

    const data = await response.json()
    return data.status === 'success' || data.status === 'Successful'
  } catch {
    return false
  }
}

export function verifyWebhookSignature(payload: unknown, signature: string | null): boolean {
  if (!signature || !SIGNATURE_KEY) return false
  
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', SIGNATURE_KEY)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return signature === expectedSignature
}
