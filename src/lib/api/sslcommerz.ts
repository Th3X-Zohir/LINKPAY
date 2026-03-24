import crypto from 'crypto'

const SSLCOMMERZ_URL = process.env.SSLCOMMERZ_URL || 'https://sandbox.sslcommerz.com'
const STORE_ID = process.env.SSLCOMMERZ_STORE_ID
const STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD

interface SSLCommerzPaymentRequest {
  amount: number
  description: string
  customerName: string
  customerEmail: string
  customerMobile: string
  successUrl: string
  failUrl: string
  cancelUrl: string
  paymentUrl?: string
  customerAddress?: string
  customerCity?: string
  customerPostcode?: string
}

interface SSLCommerzPaymentResponse {
  status: 'success' | 'fail' | 'pending'
  sessionkey?: string
  gatewayUrl?: string
  paymentMethod?: string
  storeRedirectUrl?: string
  error?: string
}

function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export async function createSSLCommerzPayment(request: SSLCommerzPaymentRequest): Promise<SSLCommerzPaymentResponse> {
  try {
    const sessionId = generateSessionId()
    
    const payload = {
      store_id: STORE_ID,
      store_passwd: STORE_PASSWORD,
      total_amount: request.amount / 100, // Convert from paisa to taka
      currency: 'BDT',
      tran_id: sessionId,
      success_url: request.successUrl,
      fail_url: request.failUrl,
      cancel_url: request.cancelUrl,
     emi_option: '0',
      product_profile: 'general',
      product_type: 'payment-link',
      // Customer details
      cus_name: request.customerName,
      cus_email: request.customerEmail,
      cus_mobile: request.customerMobile,
      cus_add1: request.customerAddress || 'Customer Address',
      cus_city: request.customerCity || 'Dhaka',
      cus_postcode: request.customerPostcode || '1000',
      // Product details
      product_name: request.description.substring(0, 100),
      product_category: 'Payment Link',
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sslcommerz`,
    }

    const response = await fetch(`${SSLCOMMERZ_URL}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(payload as unknown as Record<string, string>).toString()
    })

    const data = await response.json()

    if (data.status !== 'SUCCESS' && data.status !== 'PENDING') {
      return { status: 'fail', error: data.failedreason || 'Payment initiation failed' }
    }

    return {
      status: data.status === 'PENDING' ? 'pending' : 'success',
      sessionkey: data.sessionkey,
      gatewayUrl: data.gatewayUrl,
      paymentMethod: data.card_brand,
      storeRedirectUrl: data.redirectGatewayURL
    }
  } catch (error) {
    console.error('SSLCommerz error:', error)
    return { status: 'fail', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function verifySSLCommerzPayment(sessionKey: string, tranId: string): Promise<{
  valid: boolean
  amount?: number
  status?: string
  cardBrand?: string
}> {
  try {
    const verificationPayload = {
      val_id: sessionKey,
      store_id: STORE_ID,
      store_passwd: STORE_PASSWORD
    }

    const response = await fetch(`${SSLCOMMERZ_URL}/validator/api/validationserverAPI.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(verificationPayload as unknown as Record<string, string>).toString()
    })

    const data = await response.json()

    return {
      valid: data.status === 'VALID' || data.status === 'VALIDATED',
      amount: data.amount ? Math.round(parseFloat(data.amount) * 100) : undefined,
      status: data.status,
      cardBrand: data.card_brand
    }
  } catch {
    return { valid: false }
  }
}

export function verifySSLCommerzWebhook(
  postData: Record<string, string>
): { valid: boolean; status: string; tranId: string; amount: number } | null {
  // SSLCommerz webhook verification
  // In production, you would verify the hash
  if (!postData || !postData.status || !postData.tran_id) {
    return null
  }

  const { status, tran_id, amount, val_id } = postData

  // Basic validation
  if (status === 'VALIDATED' || status === '成功' || status === 'CANCELLED' || status === 'FAILED') {
    return {
      valid: true,
      status,
      tranId: tran_id,
      amount: Math.round(parseFloat(amount || '0') * 100)
    }
  }

  return null
}

// Hash generation for SSLCommerz
export function generateSSLCCommerzHash(data: Record<string, string>): string {
  const { store_id, store_passwd, total_amount, tran_id, currency } = data
  
  // Create hash string in specific order
  const hashString = `${store_id}${store_passwd}${total_amount}${tran_id}${currency}`
  
  return crypto.createHash('md5').update(hashString).digest('hex')
}
