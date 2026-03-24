import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateInvoicePDF } from '@/lib/invoice-pdf'
import { generateInvoiceNumber } from '@/lib/invoice-number'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Buffer>>> {
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
        { success: false, error: 'Invoice can only be generated for successful transactions' },
        { status: 400 }
      )
    }

    // Get or create invoice record
    let invoice = await db.invoice.findFirst({
      where: { transactionId: transaction.id }
    })

    const invoiceNumber = invoice?.invoiceNumber || await generateInvoiceNumber()
    const isPremium = transaction.user.plan === 'PREMIUM'

    // Create or update invoice record
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

    // Update invoice with generated status
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: 'GENERATED' }
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
