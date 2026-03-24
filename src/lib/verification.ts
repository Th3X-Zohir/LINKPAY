import { db } from './db'
import { randomBytes } from 'crypto'

const TOKEN_EXPIRY_HOURS = 24

export type VerificationTokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'

export async function createVerificationToken(
  email: string,
  type: VerificationTokenType = 'EMAIL_VERIFICATION'
): Promise<string> {
  // Delete any existing tokens for this email
  await db.verificationToken.deleteMany({
    where: { email }
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await db.verificationToken.create({
    data: {
      email,
      token,
      type,
      expiresAt
    }
  })

  return token
}

export async function verifyToken(
  token: string,
  type?: VerificationTokenType
): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return { valid: false, error: 'Invalid token' }
    }

    if (verificationToken.expiresAt < new Date()) {
      await db.verificationToken.delete({ where: { token } })
      return { valid: false, error: 'Token has expired' }
    }

    if (type && verificationToken.type !== type) {
      return { valid: false, error: 'Invalid token type' }
    }

    // Delete the token after verification
    await db.verificationToken.delete({ where: { token } })

    return { valid: true, email: verificationToken.email }
  } catch (error) {
    console.error('Verification error:', error)
    return { valid: false, error: 'Verification failed' }
  }
}

export async function deleteVerificationTokens(email: string): Promise<void> {
  await db.verificationToken.deleteMany({
    where: { email }
  })
}
