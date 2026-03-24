import { db } from '@/lib/db'
import { AuditAction } from '@prisma/client'

interface CreateAuditLogParams {
  action: AuditAction
  userId?: string
  targetUserId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry in the database.
 * This function is non-blocking - it fires and forgets with error logging.
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  const { action, userId, targetUserId, metadata, ipAddress, userAgent } = params

  // Fire and forget - don't await directly to avoid blocking main functionality
  db.auditLog
    .create({
      data: {
        action,
        userId: userId || null,
        details: metadata
          ? {
              ...metadata,
              targetUserId,
            }
          : targetUserId
          ? { targetUserId }
          : undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    })
    .catch((error) => {
      console.error('Failed to create audit log:', {
        action,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    })
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return undefined
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}
