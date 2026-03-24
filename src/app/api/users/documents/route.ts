import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Configure upload directory via environment variable, default to /app/data/uploads in Docker
const getUploadDir = () => {
  // UPLOAD_DIR can be set via environment variable for Docker/custom deployments
  // Default to ./data/uploads relative to process.cwd() for local development
  return process.env.UPLOAD_DIR || join(process.cwd(), 'data', 'uploads')
}

const documentTypes = ['CONTRACT', 'DELIVERY_PROOF', 'ID_PROOF', 'TAX_DOCUMENT', 'BUSINESS_LICENSE', 'OTHER'] as const

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const documents = await db.document.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        url: true,
        verified: true,
        verifiedAt: true,
        rejectionReason: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: documents
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type || !documentTypes.includes(type as typeof documentTypes[number])) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, PDF, DOC, DOCX' },
        { status: 400 }
      )
    }

    // Create uploads directory structure if it doesn't exist
    const baseUploadDir = getUploadDir()
    const uploadDir = join(baseUploadDir, 'documents', session.user.id)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin'
    const filename = `${randomUUID()}.${ext}`
    const filepath = join(uploadDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Create URL path (use /api/uploads prefix to serve via route handler in standalone mode)
    const url = `/api/uploads/documents/${session.user.id}/${filename}`

    // Save to database
    const document = await db.document.create({
      data: {
        userId: session.user.id,
        type: type as typeof documentTypes[number],
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DOCUMENT_UPLOADED',
        details: { documentId: document.id, type: document.type }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        type: document.type,
        filename: document.filename,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        url: document.url,
        verified: document.verified,
        createdAt: document.createdAt
      }
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}