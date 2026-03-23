const BKASH_URL = process.env.BKASH_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
const BKASH_USERNAME = process.env.BKASH_USERNAME
const BKASH_PASSWORD = process.env.BKASH_PASSWORD
const BKASH_APP_KEY = process.env.BKASH_APP_KEY
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET

interface BkashTokenResponse {
  status: 'success' | 'fail'
  id_token?: string
  token_type?: string
  expires_in?: number
  error?: string
}

interface BkashPayoutResponse {
  status: 'success' | 'fail'
  trxId?: string
  error?: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getBkashToken(): Promise<BkashTokenResponse> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return { status: 'success', id_token: cachedToken.token, token_type: 'Bearer' }
  }

  try {
    const response = await fetch(`${BKASH_URL}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': BKASH_USERNAME!,
        'password': BKASH_PASSWORD!
      },
      body: JSON.stringify({
        app_key: BKASH_APP_KEY,
        app_secret: BKASH_APP_SECRET
      })
    })

    const data = await response.json()

    if (data.status_code !== '0000' && data.status_code !== 200) {
      return { status: 'fail', error: data.status_message || 'Token generation failed' }
    }

    cachedToken = {
      token: data.id_token,
      expiresAt: Date.now() + ((data.expires_in - 60) * 1000)
    }

    return {
      status: 'success',
      id_token: data.id_token,
      token_type: 'Bearer',
      expires_in: data.expires_in
    }
  } catch (error) {
    return { status: 'fail', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function initiateBkashPayout(
  amount: number,
  msisdn: string,
  reference: string
): Promise<BkashPayoutResponse> {
  const tokenResult = await getBkashToken()
  if (tokenResult.status !== 'success' || !tokenResult.id_token) {
    return { status: 'fail', error: 'Failed to get bKash token' }
  }

  try {
    const response = await fetch(`${BKASH_URL}/tokenized/checkout/payment/disburse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenResult.id_token}`,
        'X-APP-Key': BKASH_APP_KEY!
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: 'BDT',
        merchantInvoiceNumber: reference,
        msisdn: msisdn,
        type: 'DEBIT'
      })
    })

    const data = await response.json()

    if (data.status_code !== '0000' && data.status_code !== 200) {
      return { status: 'fail', error: data.status_message || 'Payout initiation failed' }
    }

    return {
      status: 'success',
      trxId: data.trx_id
    }
  } catch (error) {
    return { status: 'fail', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function checkBkashPayoutStatus(trxId: string): Promise<string> {
  const tokenResult = await getBkashToken()
  if (tokenResult.status !== 'success' || !tokenResult.id_token) {
    return 'FAILED'
  }

  try {
    const response = await fetch(`${BKASH_URL}/tokenized/checkout/payment/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenResult.id_token}`,
        'X-APP-Key': BKASH_APP_KEY!
      },
      body: JSON.stringify({
        trx_id: trxId
      })
    })

    const data = await response.json()
    return data.status || 'UNKNOWN'
  } catch {
    return 'FAILED'
  }
}
