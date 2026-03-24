import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import PDFDocument from 'pdfkit'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateInvoiceNumber } from '@/lib/invoice-number'
import { isAdmin } from '@/lib/admin'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const serviceCategoryLabels: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  GRAPHIC_DESIGN: 'Graphic Design',
  DATA_ENTRY: 'Data Entry',
  CONSULTING: 'Consulting',
  COPYWRITING: 'Copywriting',
  VIDEO_EDITING: 'Video Editing',
  OTHER: 'Other'
}

async function generateCompliancePackPDF(params: {
  transaction: {
    id: string
    amount: number
    platformFee: number
    gatewayFee: number
    netAmount: number
    status: string
    aamarPayTxnId: string | null
    createdAt: Date
    paymentLink: {
      description: string
      customerName: string | null
      customerEmail: string | null
      customerMobile: string | null
      serviceCategory: string
      createdAt: Date
    }
  }
  invoiceNumber: string
  user: {
    name: string | null
    email: string
    phone: string | null
    businessName: string | null
    businessAddress: string | null
  }
}): Promise<Buffer> {
  const { transaction, invoiceNumber, user } = params

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

    // ===== INVOICE SECTION =====
    doc.fillColor('#0A1628')
      .rect(0, 0, pageWidth, 100)
      .fill()

    doc.fillColor('#FFFFFF')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('COMPLIANCE PACK', leftMargin, y + 15)

    doc.fontSize(10)
      .font('Helvetica')
      .text(`Document #: ${invoiceNumber}`, leftMargin, y + 45)
      .text(`Date: ${formatDate(transaction.createdAt)}`, leftMargin, y + 58)

    doc.fontSize(12)
      .font('Helvetica-Bold')
      .text('LinkPay BD', pageWidth - 180, y + 20)

    y = 130

    // ===== INVOICE SECTION =====
    doc.fillColor('#0A1628')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('1. INVOICE', leftMargin, y)

    y += 25

    doc.strokeColor('#E2E8F0')
      .lineWidth(1)
      .moveTo(leftMargin, y)
      .lineTo(contentWidth, y)
      .stroke()

    y += 20

    // Invoice details table
    doc.fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text('Invoice Number:', leftMargin, y)
      .text('Transaction ID:', leftMargin, y + 18)
      .text('Date:', leftMargin, y + 36)
      .text('Status:', leftMargin, y + 54)

    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(invoiceNumber, leftMargin + 120, y)
      .text(transaction.aamarPayTxnId || transaction.id.substring(0, 16) + '...', leftMargin + 120, y + 18)
      .text(formatDate(transaction.createdAt), leftMargin + 120, y + 36)
      .text(transaction.status, leftMargin + 120, y + 54)

    y += 90

    // ===== PAYMENT RECEIPT SECTION =====
    doc.fillColor('#0A1628')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('2. PAYMENT RECEIPT', leftMargin, y)

    y += 25

    doc.strokeColor('#E2E8F0')
      .lineWidth(1)
      .moveTo(leftMargin, y)
      .lineTo(contentWidth, y)
      .stroke()

    y += 20

    doc.fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text('Service Amount:', leftMargin, y)
      .text('Platform Fee (0.75%):', leftMargin, y + 18)
      .text('Gateway Fee (2.55%):', leftMargin, y + 36)
      .text('Total Deductions:', leftMargin, y + 54)
      .text('Net Amount:', leftMargin, y + 72)

    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(formatCurrency(transaction.amount), leftMargin + 140, y)
      .text(`-${formatCurrency(transaction.platformFee)}`, leftMargin + 140, y + 18)
      .text(`-${formatCurrency(transaction.gatewayFee)}`, leftMargin + 140, y + 36)
      .text(`-${formatCurrency(transaction.platformFee + transaction.gatewayFee)}`, leftMargin + 140, y + 54)

    doc.fillColor('#059669')
      .fontSize(12)
      .text(formatCurrency(transaction.netAmount), leftMargin + 140, y + 72)

    y += 110

    // ===== CLIENT INFORMATION SECTION =====
    doc.fillColor('#0A1628')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('3. CLIENT INFORMATION', leftMargin, y)

    y += 25

    doc.strokeColor('#E2E8F0')
      .lineWidth(1)
      .moveTo(leftMargin, y)
      .lineTo(contentWidth, y)
      .stroke()

    y += 20

    doc.fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text('Client Name:', leftMargin, y)
      .text('Email:', leftMargin, y + 18)
      .text('Mobile:', leftMargin, y + 36)

    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(transaction.paymentLink.customerName || 'Not provided', leftMargin + 120, y)
      .text(transaction.paymentLink.customerEmail || 'Not provided', leftMargin + 120, y + 18)
      .text(transaction.paymentLink.customerMobile || 'Not provided', leftMargin + 120, y + 36)

    y += 80

    // ===== SERVICE DECLARATION SECTION =====
    doc.fillColor('#0A1628')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('4. SERVICE DECLARATION', leftMargin, y)

    y += 25

    doc.strokeColor('#E2E8F0')
      .lineWidth(1)
      .moveTo(leftMargin, y)
      .lineTo(contentWidth, y)
      .stroke()

    y += 20

    doc.fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica')
      .text('Service Category:', leftMargin, y)
      .text('Service Description:', leftMargin, y + 18)

    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(serviceCategoryLabels[transaction.paymentLink.serviceCategory] || 'Other', leftMargin + 140, y)
      .text(transaction.paymentLink.description, leftMargin + 140, y + 18)

    y += 60

    // Service declaration text
    doc.fillColor('#F8FAFC')
      .rect(leftMargin, y, contentWidth, 60)
      .fill()

    doc.fillColor('#64748B')
      .fontSize(9)
      .font('Helvetica')
      .text(
        'I/We hereby declare that the services mentioned above have been rendered as per the agreement with the client. The payment received is for legitimate business purposes and complies with all applicable laws and regulations of Bangladesh.',
        leftMargin + 10,
        y + 10,
        { width: contentWidth - 20, align: 'left' }
      )

    y += 80

    // Signature line
    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Service Provider Declaration:', leftMargin, y)

    y += 30

    doc.strokeColor('#0A1628')
      .lineWidth(1)
      .moveTo(leftMargin, y)
      .lineTo(leftMargin + 200, y)
      .stroke()

    y += 5

    doc.fillColor('#64748B')
      .fontSize(9)
      .font('Helvetica')
      .text('Signature & Date', leftMargin, y)

    doc.fillColor('#0A1628')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(user.businessName || user.name || 'Freelancer', leftMargin + 250, y - 25)

    y += 5

    doc.fillColor('#64748B')
      .fontSize(9)
      .font('Helvetica')
      .text(user.email, leftMargin + 250, y)

    // Footer
    doc.fillColor('#64748B')
      .fontSize(8)
      .text(
        `Generated on ${new Date().toLocaleString('en-BD')} | LinkPay BD Compliance Document`,
        leftMargin,
        pageHeight - 50,
        { align: 'center', width: contentWidth }
      )

    doc.end()
  })
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
    const userIsAdmin = await isAdmin()

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        paymentLink: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            businessName: true,
            businessAddress: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check ownership (user owns the transaction or is admin)
    if (transaction.userId !== session.user.id && !userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (transaction.status !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Compliance pack can only be generated for successful transactions' },
        { status: 400 }
      )
    }

    // Get or create invoice number
    const invoice = await db.invoice.findFirst({
      where: { transactionId: transaction.id }
    })

    const invoiceNumber = invoice?.invoiceNumber || await generateInvoiceNumber()

    // Generate the compliance pack PDF
    const pdfBuffer = await generateCompliancePackPDF({
      transaction,
      invoiceNumber,
      user: transaction.user
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-pack-${invoiceNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Compliance pack generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate compliance pack' },
      { status: 500 }
    )
  }
}