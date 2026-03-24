import { db } from './db'

/**
 * Generate a unique invoice number in format LP-{YEAR}{MONTH}{DAY}-{6-digit-random}
 * Example: LP-20260324-847291
 */
export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  
  const datePrefix = `LP-${year}${month}${day}-`
  
  // Generate random 6-digit number
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString()
  const candidateInvoiceNumber = `${datePrefix}${randomPart}`
  
  // Check if it already exists in database
  const existing = await db.invoice.findUnique({
    where: { invoiceNumber: candidateInvoiceNumber }
  })
  
  // If exists, try again (recursive, but should be rare)
  if (existing) {
    return generateInvoiceNumber()
  }
  
  return candidateInvoiceNumber
}
