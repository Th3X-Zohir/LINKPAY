import PDFDocument from 'pdfkit'
import { db } from './db'

interface InvoiceData {
  paymentLinkId: string
  transactionId?: string
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const paymentLink = await db.paymentLink.findUnique({
    where: { id: data.paymentLinkId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      },
      transactions: {
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!paymentLink) {
    throw new Error('Payment link not found')
  }

  const transaction = data.transactionId
    ? paymentLink.transactions.find(t => t.id === data.transactionId)
    : paymentLink.transactions[0]

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50 })

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const width = doc.page.width - 100
    let y = 50

    doc.fillColor('#0A1628')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, y)

    doc.fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text('LinkPay BD', 50, y + 30)
      .text('Payment Link Platform for Bangladeshi Freelancers', 50, y + 42)

    doc.fillColor('#0A1628')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BILL TO:', width - 150, y)
      .font('Helvetica')
      .fontSize(10)
      .text(paymentLink.customerName || paymentLink.user.name || 'Customer', width - 150, y + 18)
      .text(paymentLink.customerEmail || paymentLink.user.email || '', width - 150, y + 32)

    if (paymentLink.customerMobile || paymentLink.user.phone) {
      doc.text(paymentLink.customerMobile || paymentLink.user.phone || '', width - 150, y + 46)
    }

    y = 150

    doc.fillColor('#E2E8F0')
      .rect(50, y, width, 25)
      .fill()

    doc.fillColor('#0A1628')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('DESCRIPTION', 60, y + 8)
      .text('DATE', 300, y + 8)
      .text('AMOUNT', width - 80, y + 8, { align: 'right' })

    y = 190

    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica')
      .text(paymentLink.description, 60, y)
      .text(new Date(paymentLink.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), 300, y)
      .text(`৳${(paymentLink.amount / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, width - 80, y, { align: 'right' })

    if (transaction) {
      y += 40

      doc.fillColor('#F1F5F9')
        .rect(50, y, width, 60)
        .fill()

      y += 15

      doc.fillColor('#64748B')
        .fontSize(9)
        .text('Transaction ID:', 60, y)
        .text('Platform Fee (0.75%):', 60, y + 14)
        .text('Gateway Fee (2.55%):', 60, y + 28)

      doc.fillColor('#0A1628')
      doc.text(transaction.aamarPayTxnId || transaction.id.substring(0, 12) + '...', 180, y)
        .text(`-৳${(transaction.platformFee / 100).toFixed(2)}`, 180, y + 14)
        .text(`-৳${(transaction.gatewayFee / 100).toFixed(2)}`, 180, y + 28)

      y += 50

      doc.moveTo(50, y)
        .lineTo(width + 50, y)
        .stroke()

      y += 15

      doc.fillColor('#059669')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('NET AMOUNT:', 300, y)
        .text(`৳${(transaction.netAmount / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, width - 80, y, { align: 'right' })
    }

    doc.fillColor('#64748B')
      .fontSize(8)
      .font('Helvetica')
      .text(
        'This is a computer-generated invoice. Payment processed via LinkPay BD and aamarPay.',
        50,
        doc.page.height - 80,
        { align: 'center', width }
      )

    doc.end()
  })
}

export function getInvoiceStream(data: InvoiceData): Promise<Buffer> {
  return generateInvoicePDF(data)
}
