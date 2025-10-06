import crypto from 'node:crypto'

const SCRYPT_N = 16384
const SCRYPT_r = 8
const SCRYPT_p = 1
const KEYLEN = 64

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p }, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey as Buffer)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  const dk = await scryptAsync(password, salt)
  const encodedSalt = salt.toString('base64')
  const encodedHash = dk.toString('base64')
  return `scrypt:${SCRYPT_N}:${SCRYPT_r}:${SCRYPT_p}:${encodedSalt}:${encodedHash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split(':')
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false
    const N = Number(parts[1])
    const r = Number(parts[2])
    const p = Number(parts[3])
    const salt = Buffer.from(parts[4], 'base64')
    const expected = Buffer.from(parts[5], 'base64')
    const dk = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, expected.length, { N, r, p }, (err, out) => {
        if (err) return reject(err)
        resolve(out as Buffer)
      })
    })
    return crypto.timingSafeEqual(expected, dk)
  } catch {
    return false
  }
}