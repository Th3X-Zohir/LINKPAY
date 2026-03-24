import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits for GCM (recommended)
const AUTH_TAG_LENGTH = 16 // 128 bits

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // Key should be 32 bytes (256 bits) for AES-256
  // Support hex (64 chars), base64 (44 chars), or raw string
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }

  if (key.length === 44) {
    return Buffer.from(key, 'base64')
  }

  // Raw string - hash to get 32 bytes
  return crypto.createHash('sha256').update(key).digest()
}

export interface EncryptedData {
  iv: string // hex
  authTag: string // hex
  encrypted: string // hex
}

export interface StoredEncryptedData extends EncryptedData {
  salt?: string // hex (optional, for key derivation)
}

/**
 * Encrypts plaintext using AES-256-GCM
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM
 */
export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey()
  const iv = Buffer.from(data.iv, 'hex')
  const authTag = Buffer.from(data.authTag, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypt an object by serializing to JSON first
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T): EncryptedData {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypt and parse JSON object
 */
export function decryptObject<T>(data: EncryptedData): T {
  return JSON.parse(decrypt(data)) as T
}

/**
 * Encrypt NID for storage
 * @param nid - The NID string to encrypt
 * @returns JSON string of encrypted data, or empty string if nid is falsy
 */
export function encryptNid(nid: string | null | undefined): string {
  if (!nid || nid.trim() === '') return ''
  const encrypted = encrypt(nid.trim())
  return JSON.stringify(encrypted)
}

/**
 * Decrypt NID from storage
 * @param encryptedNid - JSON string of encrypted data
 * @returns Decrypted NID, or null if decryption fails or input is empty
 */
export function decryptNid(encryptedNid: string | null | undefined): string | null {
  if (!encryptedNid || encryptedNid.trim() === '') return null

  try {
    const data: EncryptedData = JSON.parse(encryptedNid)
    return decrypt(data)
  } catch {
    // If parsing/decryption fails, return null
    // Data might be stored unencrypted in development
    return null
  }
}

/**
 * Hash a value using SHA-256 (one-way, for searching/comparing)
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Verify a value against a hash
 */
export function verifyHash(value: string, hash: string): boolean {
  return hashValue(value) === hash
}
