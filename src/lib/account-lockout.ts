import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

interface LockoutResult {
  isLocked: boolean
  remainingAttempts: number
  lockedUntil?: Date
}

/**
 * Check if an account is currently locked.
 */
export async function checkAccountLockout(userId: string): Promise<LockoutResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  })

  if (!user) {
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS }
  }

  const now = new Date()

  // Check if locked and lockout has expired
  if (user.lockedUntil && user.lockedUntil > now) {
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockedUntil: user.lockedUntil,
    }
  }

  // If lockout expired, reset the failed attempts
  if (user.lockedUntil && user.lockedUntil <= now) {
    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })
  }

  const remainingAttempts = Math.max(
    0,
    MAX_FAILED_ATTEMPTS - (user.failedLoginAttempts || 0)
  )

  return {
    isLocked: false,
    remainingAttempts,
  }
}

/**
 * Record a failed login attempt and potentially lock the account.
 */
export async function recordFailedLoginAttempt(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LockoutResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  })

  if (!user) {
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS }
  }

  const currentAttempts = (user.failedLoginAttempts || 0) + 1
  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - currentAttempts)

  // Check if we should lock the account
  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)

    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: currentAttempts,
        lockedUntil,
      },
    })

    // Log the lockout event
    await createAuditLog({
      action: 'ACCOUNT_LOCKED',
      userId,
      metadata: {
        reason: 'Too many failed login attempts',
        failedAttempts: currentAttempts,
        lockedUntil: lockedUntil.toISOString(),
      },
      ipAddress,
      userAgent,
    })

    return {
      isLocked: true,
      remainingAttempts: 0,
      lockedUntil,
    }
  }

  // Just increment the failed attempts counter
  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: currentAttempts,
    },
  })

  return {
    isLocked: false,
    remainingAttempts,
  }
}

/**
 * Reset failed login attempts after successful login.
 */
export async function resetFailedLoginAttempts(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })

  // Log successful login reset
  await createAuditLog({
    action: 'LOGIN_ATTEMPTS_RESET',
    userId,
    metadata: {
      reason: 'Successful login',
    },
    ipAddress,
    userAgent,
  })
}

/**
 * Manually unlock an account (admin action).
 */
export async function unlockAccount(
  userId: string,
  adminUserId: string,
  ipAddress?: string
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })

  // Log the admin unlock action
  await createAuditLog({
    action: 'ACCOUNT_UNLOCKED',
    userId,
    metadata: {
      unlockedBy: adminUserId,
      reason: 'Admin manual unlock',
    },
    ipAddress,
  })
}
