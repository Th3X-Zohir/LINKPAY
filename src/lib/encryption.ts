import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 characters (256 bits)')
  }
  return Buffer.from(key, 'utf-8')
}

export interface EncryptedData {
  iv: string
  authTag: string
  encrypted: string
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted
  }
}

export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey()
  const iv = Buffer.from(data.iv, 'hex')
  const authTag = Buffer.from(data.authTag, 'hex')
  const encrypted = data.encrypted
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function encryptObject<T extends Record<string, unknown>>(obj: T): EncryptedData {
  return encrypt(JSON.stringify(obj))
}

export function decryptObject<T>(data: EncryptedData): T {
  return JSON.parse(decrypt(data)) as T
}
