/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and escapes special characters.
 */

/**
 * HTML entities that need to be escaped
 */
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

/**
 * Escape special HTML characters in a string.
 */
function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Strip HTML tags from a string.
 */
function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize a string input for safe display.
 * - Strips HTML tags
 * - Escapes special characters
 * - Trims whitespace
 *
 * @param input - The raw user input
 * @param maxLength - Maximum length (default: 500)
 * @returns Sanitized string safe for display/storage
 */
export function sanitizeString(input: unknown, maxLength: number = 500): string {
  if (input === null || input === undefined) {
    return ''
  }

  let str = String(input)

  // Strip HTML tags first (before escaping to avoid double encoding)
  str = stripHtmlTags(str)

  // Escape HTML entities
  str = escapeHtml(str)

  // Trim and limit length
  str = str.trim()

  if (str.length > maxLength) {
    str = str.substring(0, maxLength)
  }

  return str
}

/**
 * Sanitize a payment link description.
 * - Allows certain safe characters for formatting
 * - Strips dangerous tags
 * - Enforces max length
 */
export function sanitizeDescription(input: unknown): string {
  if (input === null || input === undefined) {
    return ''
  }

  let str = String(input)

  // Strip all HTML tags
  str = stripHtmlTags(str)

  // Allow only safe characters (letters, numbers, spaces, punctuation)
  str = str.replace(/[^\w\s\-.,!?@#$%&()]/g, '')

  // Escape any remaining special chars
  str = escapeHtml(str)

  // Trim and enforce max length (500 as per schema)
  str = str.trim()

  if (str.length > 500) {
    str = str.substring(0, 500)
  }

  return str
}

/**
 * Sanitize a name field.
 * - Only allows letters, spaces, hyphens, apostrophes
 * - Strips HTML
 * - Handles unicode for Bengali
 */
export function sanitizeName(input: unknown): string {
  if (input === null || input === undefined) {
    return ''
  }

  let str = String(input)

  // Strip HTML tags
  str = stripHtmlTags(str)

  // Allow letters (including Bengali unicode range), spaces, hyphens, apostrophes
  str = str.replace(/[^\w\s\u0980-\u09FF\u0600-\u06FF\u4e00-\u9fff\-']/g, '')

  // Escape special characters
  str = escapeHtml(str)

  // Trim and enforce reasonable length (100 chars)
  str = str.trim()

  if (str.length > 100) {
    str = str.substring(0, 100)
  }

  return str
}

/**
 * Sanitize an email (basic validation + sanitization).
 * Does NOT replace proper email validation - use Zod schema for that.
 */
export function sanitizeEmail(input: unknown): string {
  if (input === null || input === undefined) {
    return ''
  }

  let str = String(input)

  // Strip HTML tags
  str = stripHtmlTags(str)

  // Basic email pattern - just remove potentially dangerous chars
  str = str.replace(/[<>'"`]/g, '')

  return str.trim().toLowerCase()
}

/**
 * Sanitize a phone number.
 * Only allows digits, plus sign, and spaces.
 */
export function sanitizePhone(input: unknown): string {
  if (input === null || input === undefined) {
    return ''
  }

  let str = String(input)

  // Strip HTML tags
  str = stripHtmlTags(str)

  // Only allow digits, plus sign, spaces, and dashes (for formatting)
  str = str.replace(/[^\d+\- ]/g, '')

  return str.trim()
}

/**
 * Create a sanitized object from user input.
 * Useful for sanitizing entire request bodies.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fields: Record<keyof T, (input: unknown) => string>
): Partial<Record<keyof T, string>> {
  const sanitized: Partial<Record<keyof T, string>> = {}

  for (const [key, sanitizer] of Object.entries(fields)) {
    if (key in obj) {
      sanitized[key as keyof T] = sanitizer(obj[key as keyof T])
    }
  }

  return sanitized
}
