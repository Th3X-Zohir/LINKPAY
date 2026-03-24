import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const RETENTION_YEARS = 2

/**
 * DELETE /api/admin/audit-logs/cleanup
 * Delete audit logs older than the retention period (default: 2 years).
 * Admin only endpoint.
 */
export async function DELETE(): Promise<NextResponse<ApiResponse<{ deletedCount: number; retentionDays: number }>>> {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const now = new Date()
    const retentionDate = new Date(
      now.getFullYear() - RETENTION_YEARS,
      now.getMonth(),
      now.getDate()
    )

    // Delete old audit logs
    const result = await db.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: retentionDate,
        },
      },
    })

    // Log this cleanup action using ADMIN_PLAN_CHANGED as a generic admin action
    // (no specific audit action for cleanup exists in enum)
    await createAuditLog({
      action: 'ADMIN_PLAN_CHANGED', // Using existing action as placeholder
      metadata: {
        actionType: 'AUDIT_LOG_CLEANUP',
        deletedCount: result.count,
        retentionDays: RETENTION_YEARS * 365,
        cleanupDate: now.toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
        retentionDays: RETENTION_YEARS * 365,
      },
      message: `Successfully deleted ${result.count} audit logs older than ${RETENTION_YEARS} years`,
    })
  } catch (error) {
    console.error('Audit log cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup audit logs',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/audit-logs/cleanup
 * Get information about audit log retention status.
 */
export async function GET(): Promise<NextResponse<ApiResponse<{
  oldestLogDate: Date | null;
  totalCount: number;
  retentionDays: number;
  wouldDeleteCount: number;
}>>> {
  const adminError = await requireAdmin()
  if (adminError) return adminError

  try {
    const now = new Date()
    const retentionDate = new Date(
      now.getFullYear() - RETENTION_YEARS,
      now.getMonth(),
      now.getDate()
    )

    // Get oldest log
    const oldestLog = await db.auditLog.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })

    // Get total count
    const totalCount = await db.auditLog.count()

    // Get count that would be deleted
    const wouldDeleteCount = await db.auditLog.count({
      where: {
        createdAt: {
          lt: retentionDate,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        oldestLogDate: oldestLog?.createdAt || null,
        totalCount,
        retentionDays: RETENTION_YEARS * 365,
        wouldDeleteCount,
      },
    })
  } catch (error) {
    console.error('Audit log status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get audit log status',
      },
      { status: 500 }
    )
  }
}
