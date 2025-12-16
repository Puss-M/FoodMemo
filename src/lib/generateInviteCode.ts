/**
 * Generate a unique invitation code
 * Format: 6-character alphanumeric code (e.g., "A3X9K2")
 * Excludes confusing characters: 0/O, 1/I/l
 */
export function generateInviteCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    result += chars[randomIndex]
  }
  
  return result
}

/**
 * Validate invite code format
 */
export function isValidInviteCodeFormat(code: string): boolean {
  // Must be 6 characters, alphanumeric, no confusing chars
  const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
  return validChars.test(code)
}
