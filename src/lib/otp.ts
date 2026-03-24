import { db } from './db'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const OTP_EXPIRY_MINUTES = 5
const OTP_LENGTH = 6
const MAX_ATTEMPTS = 3
const BCRYPT_ROUNDS = 10

// Hash OTP for storage (using bcrypt for additional security)
function hashOtp(otp: string): string {
  return bcrypt.hashSync(otp, BCRYPT_ROUNDS)
}

// Verify OTP against hash
function verifyOtp(otp: string, hash: string): boolean {
  return bcrypt.compareSync(otp, hash)
}

export type OtpTokenType = 'LOGIN' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION'

export async function createOtp(
  email: string,
  type: OtpTokenType = 'LOGIN'
): Promise<{ success: true; otp: string } | { success: false; error: string }> {
  // Check rate limit - max 3 OTP requests per 5 minutes per email
  const recentOtps = await db.otpToken.findMany({
    where: {
      email,
      type,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    }
  })

  if (recentOtps.length >= 3) {
    return { success: false, error: 'Too many OTP requests. Please wait 5 minutes.' }
  }

  // Invalidate any existing unused OTPs for this email/type
  await db.otpToken.updateMany({
    where: {
      email,
      type,
      usedAt: null
    },
    data: {
      usedAt: new Date() // Mark as used (invalidated)
    }
  })

  // Generate OTP
  const otp = randomBytes(3).readUIntBE(0, 3).toString().padStart(OTP_LENGTH, '0').slice(-OTP_LENGTH)

  // Hash and store
  const otpHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await db.otpToken.create({
    data: {
      email,
      otpHash,
      type,
      expiresAt
    }
  })

  return { success: true, otp }
}

export async function verifyOtpToken(
  email: string,
  otp: string,
  type: OtpTokenType = 'LOGIN'
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Find the most recent unused OTP for this email
    const otpToken = await db.otpToken.findFirst({
      where: {
        email,
        type,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!otpToken) {
      return { valid: false, error: 'No valid OTP found. Please request a new one.' }
    }

    // Check attempts
    if (otpToken.attempts >= MAX_ATTEMPTS) {
      await db.otpToken.update({
        where: { id: otpToken.id },
        data: { usedAt: new Date() }
      })
      return { valid: false, error: 'Too many attempts. Please request a new OTP.' }
    }

    // Verify OTP
    if (!verifyOtp(otp, otpToken.otpHash)) {
      // Increment attempts
      await db.otpToken.update({
        where: { id: otpToken.id },
        data: { attempts: otpToken.attempts + 1 }
      })
      return { valid: false, error: 'Invalid OTP' }
    }

    // Mark as used
    await db.otpToken.update({
      where: { id: otpToken.id },
      data: { usedAt: new Date() }
    })

    return { valid: true }
  } catch (error) {
    console.error('OTP verification error:', error)
    return { valid: false, error: 'Verification failed' }
  }
}

export async function cleanupExpiredOtps(): Promise<void> {
  await db.otpToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })
}
