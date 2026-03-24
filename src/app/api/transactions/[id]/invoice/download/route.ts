import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // Find existing invoice
    const invoice = await db.invoice.findFirst({
      where: { transactionId: transaction.id }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found. Please generate the invoice first.' },
        { status: 404 }
      )
    }

    if (invoice.status !== 'GENERATED') {
      return NextResponse.json(
        { success: false, error: 'Invoice has not been generated yet' },
        { status: 400 }
      )
    }

    // Note: In a production environment, you would store the PDF in S3/CloudStorage
    // and return a signed URL or stream from storage
    // For this implementation, we regenerate the PDF on download
    // This ensures the PDF is always available even if storage fails
    
    const { generateInvoicePDF } = await import('@/lib/invoice-pdf')
    const isPremium = transaction.user.plan === 'PREMIUM'

    const pdfBuffer = await generateInvoicePDF({
      transaction,
      invoiceNumber: invoice.invoiceNumber,
      isPremium,
      businessName: transaction.user.name || undefined
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Invoice download error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to download invoice' },
      { status: 500 }
    )
  }
}
