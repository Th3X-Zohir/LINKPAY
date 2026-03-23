import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateInvoicePDF } from '@/lib/invoice'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const paymentLink = await db.paymentLink.findUnique({
      where: { id },
      include: {
        user: true,
        transactions: {
          where: { status: 'SUCCESS' }
        }
      }
    })

    if (!paymentLink) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    if (paymentLink.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (paymentLink.transactions.length === 0) {
      return NextResponse.json({ error: 'No successful transaction found' }, { status: 400 })
    }

    const pdfBuffer = await generateInvoicePDF({
      paymentLinkId: id,
      transactionId: paymentLink.transactions[0].id
    })

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${paymentLink.shareUrl}.pdf"`
      }
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
