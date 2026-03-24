import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateInvoicePDF } from '@/lib/invoice-pdf'
import { generateInvoiceNumber } from '@/lib/invoice-number'
import { Resend } from 'resend'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: transactionId } = await params

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        paymentLink: true,
        user: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (transaction.status !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Invoice can only be sent for successful transactions' },
        { status: 400 }
      )
    }

    // Get or create invoice record
    let invoice = await db.invoice.findFirst({
      where: { transactionId: transaction.id }
    })

    const invoiceNumber = invoice?.invoiceNumber || await generateInvoiceNumber()
    const isPremium = transaction.user.plan === 'PREMIUM'

    // Create invoice record if doesn't exist
    if (!invoice) {
      invoice = await db.invoice.create({
        data: {
          userId: transaction.userId,
          transactionId: transaction.id,
          invoiceNumber,
          amount: transaction.amount,
          status: 'GENERATED'
        }
      })
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      transaction,
      invoiceNumber: invoice.invoiceNumber,
      isPremium,
      businessName: transaction.user.name || undefined
    })

    // Determine recipient email
    const recipientEmail = transaction.paymentLink.customerEmail || transaction.user.email
    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'No email address available for this transaction' },
        { status: 400 }
      )
    }

    // Send email with PDF attachment
    await resend.emails.send({
      from: isPremium 
        ? `${transaction.user.name || 'LinkPay'} <noreply@linkpaybd.com>`
        : 'LinkPay BD <noreply@linkpaybd.com>',
      to: recipientEmail,
      subject: `Invoice #${invoice.invoiceNumber} - Payment for ${transaction.paymentLink.description}`,
      html: generateInvoiceEmailHtml(transaction, invoice.invoiceNumber),
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer.toString('base64')
        }
      ]
    })

    // Update invoice status
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: 'SENT' }
    })

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${recipientEmail}`
    })
  } catch (error) {
    console.error('Invoice email error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice email' },
      { status: 500 }
    )
  }
}

function generateInvoiceEmailHtml(
  transaction: {
    amount: number
    netAmount: number
    platformFee: number
    gatewayFee: number
    paymentLink: {
      description: string
      customerName: string | null
    }
    user: {
      name: string | null
      email: string
    }
  },
  invoiceNumber: string
): string {
  const amountFormatted = (transaction.amount / 100).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const netAmountFormatted = (transaction.netAmount / 100).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const platformFeeFormatted = (transaction.platformFee / 100).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const gatewayFeeFormatted = (transaction.gatewayFee / 100).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0A1628; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0;">LinkPay BD</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #0A1628;">Invoice #${invoiceNumber}</h2>
        <p>Dear ${transaction.paymentLink.customerName || 'Valued Customer'},</p>
        <p>Please find attached your invoice for the payment received.</p>

        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0 0 8px;"><strong>Description:</strong> ${transaction.paymentLink.description}</p>
          <p style="margin: 0 0 8px;"><strong>Amount:</strong> ৳${amountFormatted}</p>
          <p style="margin: 0 0 8px;"><strong>Platform Fee:</strong> -৳${platformFeeFormatted}</p>
          <p style="margin: 0 0 8px;"><strong>Gateway Fee:</strong> -৳${gatewayFeeFormatted}</p>
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">
            Net Amount: ৳${netAmountFormatted}
          </p>
        </div>

        <p style="color: #64748b; font-size: 14px;">
          This is a computer-generated invoice. Payment was processed via LinkPay BD and aamarPay.
        </p>

        <p style="margin-top: 24px;">
          Thank you for using LinkPay BD!
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        <p>LinkPay BD - Payment Links for Bangladeshi Freelancers</p>
      </div>
    </div>
  `
}
