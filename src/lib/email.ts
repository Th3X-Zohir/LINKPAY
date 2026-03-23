import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface PaymentReceivedEmailData {
  to: string
  freelancerName: string
  clientName?: string
  amount: number
  description: string
  netAmount: number
  platformFee: number
}

export async function sendPaymentReceivedEmail(data: PaymentReceivedEmailData) {
  try {
    const { to, freelancerName, clientName, amount, description, netAmount, platformFee } = data

    await resend.emails.send({
      from: 'LinkPay BD <noreply@linkpaybd.com>',
      to,
      subject: `Payment Received: ৳${(amount / 100).toLocaleString('en-BD')} for ${description}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A1628; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">LinkPay BD</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #059669;">Payment Received! 🎉</h2>
            <p>Hi ${freelancerName},</p>
            <p>You received a payment${clientName ? ` from ${clientName}` : ''}.</p>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0 0 8px;"><strong>Description:</strong> ${description}</p>
              <p style="margin: 0 0 8px;"><strong>Amount:</strong> ৳${(amount / 100).toLocaleString('en-BD')}</p>
              <p style="margin: 0 0 8px;"><strong>Platform Fee:</strong> -৳${(platformFee / 100).toLocaleString('en-BD')}</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">
                You Received: ৳${(netAmount / 100).toLocaleString('en-BD')}
              </p>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              The amount will be added to your available balance and can be withdrawn to your bKash account.
            </p>

            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              View Dashboard
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
            <p>LinkPay BD - Payment Links for Bangladeshi Freelancers</p>
          </div>
        </div>
      `
    })

    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

interface PayoutProcessedEmailData {
  to: string
  freelancerName: string
  amount: number
  method: 'BKASH' | 'BANK'
  trxId?: string
}

export async function sendPayoutProcessedEmail(data: PayoutProcessedEmailData) {
  try {
    const { to, freelancerName, amount, method, trxId } = data

    await resend.emails.send({
      from: 'LinkPay BD <noreply@linkpaybd.com>',
      to,
      subject: `Payout Processed: ৳${(amount / 100).toLocaleString('en-BD')} sent to ${method}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A1628; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">LinkPay BD</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #059669;">Payout Sent! 💸</h2>
            <p>Hi ${freelancerName},</p>
            <p>Your payout has been processed.</p>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0 0 8px;"><strong>Amount:</strong> ৳${(amount / 100).toLocaleString('en-BD')}</p>
              <p style="margin: 0 0 8px;"><strong>Method:</strong> ${method}</p>
              ${trxId ? `<p style="margin: 0;"><strong>Transaction ID:</strong> ${trxId}</p>` : ''}
            </div>

            <p style="color: #64748b; font-size: 14px;">
              The money should arrive in your ${method} account within 1-2 business days.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
            <p>LinkPay BD - Payment Links for Bangladeshi Freelancers</p>
          </div>
        </div>
      `
    })

    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}
