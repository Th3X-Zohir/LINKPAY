import crypto from 'crypto'

const SSLCOMMERZ_URL = process.env.SSLCOMMERZ_URL || 'https://sandbox.sslcommerz.com'
const STORE_ID = process.env.SSLCOMMERZ_STORE_ID
const STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD

export interface SSLCommerzPaymentRequest {
  amount: number
  description: string
  customerName: string
  customerEmail: string
  customerMobile: string
  successUrl: string
  failUrl: string
  cancelUrl: string
  tranId?: string
}

export interface SSLCommerzPaymentResponse {
  status: 'success' | 'fail' | 'pending'
  paymentUrl?: string
  tranId?: string
  gatewayUrl?: string
  sessionKey?: string
  error?: string
}

export interface SSLCommerzValidationResponse {
  status: string
  tranId: string
  valId?: string
  amount?: string
  storeAmount?: string
  bankTranId?: string
  cardType?: string
  cardNo?: string
  error?: string
}

/**
 * Generate signature for SSLCommerz request
 */
export function generateSSLSignature(fields: Record<string, string>): string {
  if (!STORE_PASSWORD) {
    throw new Error('SSLCOMMERZ_STORE_PASSWORD is not set')
  }

  const data = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('&')

  const signature = crypto
    .createHash('md5')
    .update(data + STORE_PASSWORD)
    .digest('hex')

  return signature.toUpperCase()
}

/**
 * Verify signature from SSLCommerz response
 */
export function verifySSLSignature(fields: Record<string, string>, expectedSignature: string): boolean {
  if (!STORE_PASSWORD) {
    return false
  }

  // Build signature data excluding the signature field itself
  const { signature: _sig, ...rest } = fields
  void _sig // Mark as intentionally unused

  const data = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&')

  const calculatedSignature = crypto
    .createHash('md5')
    .update(data + STORE_PASSWORD)
    .digest('hex')
    .toUpperCase()

  return calculatedSignature === expectedSignature?.toUpperCase()
}

/**
 * Create SSLCommerz payment session
 */
export async function createSSLCommerzPayment(
  request: SSLCommerzPaymentRequest
): Promise<SSLCommerzPaymentResponse> {
  try {
    const tranId = request.tranId || `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    const payload = {
      store_id: STORE_ID,
      store_passwd: STORE_PASSWORD,
      total_amount: request.amount.toString(),
      currency: 'BDT',
      tran_id: tranId,
      success_url: request.successUrl,
      fail_url: request.failUrl,
      cancel_url: request.cancelUrl,
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/sslcommerz`,
      multi_card_name: 'all',
      product_name: 'Payment Link',
      product_category: 'Payment Services',
      product_profile: 'general',
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_mobile: request.customerMobile,
      customer_add1: 'N/A',
      customer_city: 'Dhaka',
      customer_country: 'Bangladesh',
      shipping_method: 'NO',
      num_of_item: '1',
      product_amount: request.amount.toString(),
      vat_percent: '0',
      discount_amount: '0',
      discount_percent: '0',
      conveniene_fee: '0'
    }

    const response = await fetch(`${SSLCOMMERZ_URL}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(payload as Record<string, string>).toString()
    })

    const data = await response.json()

    if (data.status !== 'SUCCESS' && data.status !== 'SUCCESS_PENDING') {
      console.error('SSLCommerz error:', data)
      return {
        status: 'fail',
        error: data.error_message || data.failedreason || 'Payment initiation failed'
      }
    }

    return {
      status: data.status === 'SUCCESS_PENDING' ? 'pending' : 'success',
      paymentUrl: data.GatewayPageURL || data.paymentUrl,
      tranId: tranId,
      gatewayUrl: data.GatewayPageURL,
      sessionKey: data.sessionkey
    }
  } catch (error) {
    console.error('SSLCommerz error:', error)
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Verify SSLCommerz payment using validation API
 */
export async function verifySSLCommerzPayment(
  tranId: string,
  valId?: string
): Promise<SSLCommerzValidationResponse | null> {
  try {
    if (!valId) {
      console.error('SSLCommerz: valId is required for verification')
      return null
    }

    const verificationFields = {
      store_id: STORE_ID || '',
      store_passwd: STORE_PASSWORD || '',
      val_id: valId,
      format: 'json'
    }

    const signature = generateSSLSignature(verificationFields)

    const response = await fetch(
      `${SSLCOMMERZ_URL}/validator/api/validationserverAPI.php?${new URLSearchParams({
        ...verificationFields,
        signature
      }).toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()

    if (data.status !== 'VALID') {
      console.error('SSLCommerz verification failed:', data)
      return {
        status: data.status || 'FAILED',
        tranId,
        error: data.error_message || 'Verification failed'
      }
    }

    return {
      status: data.status,
      tranId: data.tran_id || tranId,
      valId: data.val_id,
      amount: data.amount,
      storeAmount: data.store_amount,
      bankTranId: data.bank_tran_id,
      cardType: data.card_type,
      cardNo: data.card_number
    }
  } catch (error) {
    console.error('SSLCommerz verification error:', error)
    return null
  }
}