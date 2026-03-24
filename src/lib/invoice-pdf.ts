import PDFDocument from 'pdfkit'
import { formatCurrency, formatDate } from './utils'

interface TransactionWithRelations {
  id: string
  amount: number
  platformFee: number
  gatewayFee: number
  netAmount: number
  status: string
  aamarPayTxnId: string | null
  createdAt: Date
  paymentLink: {
    id: string
    description: string
    customerName: string | null
    customerEmail: string | null
    customerMobile: string | null
    createdAt: Date
  }
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
    plan: string
  }
}

interface GenerateInvoicePDFParams {
  transaction: TransactionWithRelations
  invoiceNumber: string
  isPremium: boolean
  businessName?: string
}

export async function generateInvoicePDF(
  params: GenerateInvoicePDFParams
): Promise<Buffer> {
  const { transaction, invoiceNumber, isPremium, businessName } = params
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width as number
    const pageHeight = doc.page.height as number
    const contentWidth = pageWidth - 100
    const leftMargin = 50
    let y = 50

    // Header background
    doc.fillColor('#0A1628')
      .rect(0, 0, pageWidth, 120)
      .fill()

    // Header content
    doc.fillColor('#FFFFFF')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('INVOICE', leftMargin, y + 10)

    // Invoice number
    doc.fontSize(10)
      .font('Helvetica')
      .text(`Invoice #: ${invoiceNumber}`, leftMargin, y + 45)
      .text(`Date: ${formatDate(transaction.createdAt)}`, leftMargin, y + 58)

    // LinkPay branding (right side) - hide for premium
    if (!isPremium) {
      doc.fillColor('#FFFFFF')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('LinkPay BD', pageWidth - 180, y + 10)
      
      doc.fontSize(8)
        .font('Helvetica')
        .text('Payment Links for Freelancers', pageWidth - 180, y + 30)
    } else if (businessName) {
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(businessName, pageWidth - 180, y + 10)
    }

    // Premium badge if applicable
    if (isPremium) {
      doc.fillColor('#059669')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('PREMIUM', pageWidth - 180, y + 50)
    }

    y = 150

    // From section (Freelancer)
    doc.fillColor('#0A1628')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('FROM:', leftMargin, y)

    doc.fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text(transaction.user.name || 'Freelancer', leftMargin, y + 16)
      .text(transaction.user.email, leftMargin, y + 28)
      if (transaction.user.phone) {
        doc.text(transaction.user.phone, leftMargin, y + 40)
      }

    // To section (Client)
    const toX = pageWidth - 250
    doc.fillColor('#0A1628')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('BILL TO:', toX, y)

    doc.fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text(transaction.paymentLink.customerName || 'Customer', toX, y + 16)
      .text(transaction.paymentLink.customerEmail || '', toX, y + 28)
      if (transaction.paymentLink.customerMobile) {
        doc.text(transaction.paymentLink.customerMobile, toX, y + 40)
      }

    y = 220

    // Divider line
    doc.strokeColor('#E2E8F0')
      .lineWidth(1)
      .moveTo(leftMargin, y)
      .lineTo(contentWidth, y)
      .stroke()

    y += 30

    // Table header
    doc.fillColor('#F8FAFC')
      .rect(leftMargin, y, contentWidth, 30)
      .fill()

    doc.fillColor('#0A1628')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('DESCRIPTION', leftMargin + 10, y + 10)
      .text('DATE', 320, y + 10)
      .text('AMOUNT', contentWidth - 60, y + 10, { align: 'right' })

    y += 45

    // Description row
    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica')
      .text(transaction.paymentLink.description, leftMargin + 10, y)
      .text(formatDate(transaction.paymentLink.createdAt), 320, y)
      .text(formatCurrency(transaction.amount), contentWidth - 60, y, { align: 'right' })

    y += 50

    // Transaction details box
    doc.fillColor('#F8FAFC')
      .rect(leftMargin, y, contentWidth, 80)
      .fill()

    y += 15

    // Transaction details
    doc.fillColor('#64748B')
      .fontSize(9)
      .text('Transaction ID:', leftMargin + 15, y)
      .text('Platform Fee (0.75%):', leftMargin + 15, y + 16)
      .text('Gateway Fee (2.55%):', leftMargin + 15, y + 32)

    doc.fillColor('#0A1628')
      .fontSize(9)
      .font('Helvetica')
    doc.text(transaction.aamarPayTxnId || transaction.id.substring(0, 16) + '...', 150, y)
    doc.text(`-৳${(transaction.platformFee / 100).toFixed(2)}`, 150, y + 16)
    doc.text(`-৳${(transaction.gatewayFee / 100).toFixed(2)}`, 150, y + 32)

    // Status badge
    const statusColors: Record<string, string> = {
      SUCCESS: '#059669',
      FAILED: '#DC2626',
      PENDING: '#D97706',
      REFUNDED: '#2563EB'
    }
    const statusColor = statusColors[transaction.status] || '#64748B'

    doc.fillColor(statusColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(transaction.status, contentWidth - 60, y, { align: 'right' })

    y += 100

    // Divider line
    doc.strokeColor('#E2E8F0')
      .lineWidth(1)
      .moveTo(leftMargin, y)
      .lineTo(contentWidth, y)
      .stroke()

    y += 25

    // Net amount row
    doc.fillColor('#0A1628')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('NET AMOUNT:', 320, y)

    doc.fillColor('#059669')
      .fontSize(14)
      .text(formatCurrency(transaction.netAmount), contentWidth - 60, y, { align: 'right' })

    y += 60

    // Footer
    doc.fillColor('#64748B')
      .fontSize(8)
      .font('Helvetica')

    if (!isPremium) {
      doc.text(
        'This is a computer-generated invoice. Payment processed via LinkPay BD and aamarPay.',
        leftMargin,
        pageHeight - 100,
        { align: 'center', width: contentWidth }
      )
      doc.text(
        'Powered by LinkPay BD - Payment Links for Bangladeshi Freelancers',
        leftMargin,
        pageHeight - 85,
        { align: 'center', width: contentWidth }
      )
    } else {
      doc.text(
        'This is a computer-generated invoice. Payment processed via aamarPay.',
        leftMargin,
        pageHeight - 100,
        { align: 'center', width: contentWidth }
      )
    }

    doc.text(
      `Generated on ${new Date().toLocaleString('en-BD')}`,
      leftMargin,
      pageHeight - 50,
      { align: 'center', width: contentWidth }
    )

    doc.end()
  })
}
