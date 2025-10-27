import crypto from 'crypto'

// Generate a random salt
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

// Hash password with salt using SHA-256
export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

// Verify password against hash
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashedPassword = hashPassword(password, salt)
  return hashedPassword === hash
}

// Hash password with auto-generated salt
export function hashPasswordWithSalt(password: string): { hash: string; salt: string } {
  const salt = generateSalt()
  const hash = hashPassword(password, salt)
  return { hash, salt }
}
