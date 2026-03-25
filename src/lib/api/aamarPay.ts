import crypto from 'crypto'

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

export interface AamarPayPaymentResponse {
  status: 'success' | 'fail'
  payment_id?: string
  payment_url?: string
  execute_url?: string
  error?: string
}

export async function createAamarPayPayment(request: AamarPayPaymentRequest): Promise<AamarPayPaymentResponse> {
  try {
    // Validate credentials
    if (!STORE_ID || !SIGNATURE_KEY || !API_KEY) {
      console.error('aamarPay credentials missing:', { store_id: !!STORE_ID, signature_key: !!SIGNATURE_KEY, api_key: !!API_KEY })
      return { status: 'fail', error: 'Payment gateway credentials are not configured. Please contact support.' }
    }

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

    const endpoint = `${AAMARPAY_URL}/api/v1/trxbot/request`
    console.log('aamarPay request to:', endpoint, 'with payload:', JSON.stringify({ ...payload, signature_key: '***', api_key: '***' }))

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const text = await response.text()
    console.log('aamarPay response status:', response.status, 'body:', text.substring(0, 300))

    // Check if response is HTML (indicates gateway error or 404)
    if (text.trim().startsWith('<') || !text.includes('{')) {
      console.error('aamarPay gateway error (HTML response):', text.substring(0, 200))
      return {
        status: 'fail',
        error: `Payment gateway is currently unavailable. Please try again later or contact support. (Error: ${response.status})`
      }
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      return { status: 'fail', error: `Invalid response from payment gateway: ${text.substring(0, 100)}` }
    }

    if (data.result !== 'true' && data.result !== true) {
      return { status: 'fail', error: (data.error_message as string) || 'Payment initiation failed' }
    }

    return {
      status: 'success',
      payment_id: data.payment_id as string,
      payment_url: data.payment_url as string,
      execute_url: data.execute_url as string
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
  
  const expectedSignature = crypto
    .createHmac('sha256', SIGNATURE_KEY)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return signature === expectedSignature
}
