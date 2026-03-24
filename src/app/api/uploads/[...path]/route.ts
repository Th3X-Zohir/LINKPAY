import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { access } from 'fs/promises'

// Configure upload directory via environment variable, default to /app/data/uploads in Docker
const getUploadDir = () => {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'data', 'uploads')
}

// GET /api/uploads/[...path] - Serve uploaded files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filename = path[path.length - 1]

    // Security: Prevent directory traversal attacks
    // Only allow alphanumeric, dashes, underscores, dots in path segments
    const safePathPattern = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/
    for (const segment of path) {
      if (!safePathPattern.test(segment)) {
        return NextResponse.json(
          { success: false, error: 'Invalid path' },
          { status: 400 }
        )
      }
    }

    const uploadDir = getUploadDir()
    const filepath = join(uploadDir, 'documents', ...path)

    // Verify the file exists using access
    try {
      await access(filepath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Read the file
    const fileBuffer = await readFile(filepath)

    // Determine content type based on extension
    const ext = filename.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    const contentType = contentTypes[ext || ''] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving uploaded file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}