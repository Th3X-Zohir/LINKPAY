import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { isAdmin } from '@/lib/admin'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userIsAdmin = await isAdmin()

    const document = await db.document.findUnique({
      where: { id }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.userId !== session.user.id && !userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

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
        verifiedAt: document.verifiedAt,
        rejectionReason: document.rejectionReason,
        createdAt: document.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userIsAdmin = await isAdmin()

    const document = await db.document.findUnique({
      where: { id }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.userId !== session.user.id && !userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // SECURITY: Validate URL is within expected directory to prevent path traversal
    const safePathPrefix = '/api/uploads/'
    if (!document.url.startsWith(safePathPrefix)) {
      console.error('Document URL path traversal attempt detected:', document.url)
      return NextResponse.json(
        { success: false, error: 'Invalid document path' },
        { status: 400 }
      )
    }

    // Delete file from disk
    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'data', 'uploads')
    const filepath = join(uploadDir, 'documents', document.url.replace(safePathPrefix, ''))
    try {
      await unlink(filepath)
    } catch (error) {
      console.error('Error deleting file from disk:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db.document.delete({
      where: { id }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        details: { action: 'document_deleted', documentId: id }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}