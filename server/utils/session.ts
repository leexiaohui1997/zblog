import { getRedis } from './redis'
import { setCookie, getCookie, H3Event } from 'h3'
import { randomBytes } from 'node:crypto'

function getEnvNumber(name: string, fallback: number): number {
  const v = process.env[name]
  const n = v == null || v === '' ? NaN : Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function getSessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME || 'sid'
}

export function getSessionTtlSeconds(): number {
  return Math.max(60, getEnvNumber('SESSION_TTL_SECONDS', 86400))
}

export function isSessionSecure(): boolean {
  const v = String(process.env.SESSION_SECURE || 'false').toLowerCase()
  return v === 'true'
}

function makeSessionKey(sid: string) {
  return `session:${sid}`
}

export async function createAppSession(event: H3Event, payload: any): Promise<{ sid: string, ttlSeconds: number }> {
  const redis = getRedis()
  const ttl = getSessionTtlSeconds()

  // 若当前请求已带有旧会话，先清理，避免遗留无效会话占用存储
  const oldSid = getCookie(event, getSessionCookieName())
  if (oldSid) {
    try {
      await redis.del(makeSessionKey(oldSid))
    } catch {}
  }

  const sid = cryptoRandomHex(32)
  const key = makeSessionKey(sid)
  const data = { ...payload, createdAtISO: new Date().toISOString() }
  await redis.set(key, JSON.stringify(data), 'EX', ttl)
  setCookie(event, getSessionCookieName(), sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSessionSecure(),
    path: '/',
    maxAge: ttl,
  })
  return { sid, ttlSeconds: ttl }
}

export async function getAppSession(event: H3Event): Promise<{ sid: string, data: any } | null> {
  const redis = getRedis()
  const sid = getCookie(event, getSessionCookieName())
  if (!sid) return null
  const raw = await redis.get(makeSessionKey(sid))
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    return { sid, data }
  } catch {
    return null
  }
}

export async function renewAppSession(event: H3Event): Promise<{ ok: true, ttlSeconds: number } | { ok: false }> {
  const redis = getRedis()
  const sid = getCookie(event, getSessionCookieName())
  if (!sid) return { ok: false }
  const key = makeSessionKey(sid)
  const ttl = getSessionTtlSeconds()
  const exists = await redis.exists(key)
  if (!exists) return { ok: false }
  await redis.expire(key, ttl)
  setCookie(event, getSessionCookieName(), sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSessionSecure(),
    path: '/',
    maxAge: ttl,
  })
  return { ok: true, ttlSeconds: ttl }
}

export async function destroyAppSession(event: H3Event): Promise<void> {
  const redis = getRedis()
  const sid = getCookie(event, getSessionCookieName())
  if (sid) {
    await redis.del(makeSessionKey(sid))
  }
  // 清理 Cookie（设置空值与过期）
  setCookie(event, getSessionCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSessionSecure(),
    path: '/',
    maxAge: 0,
  })
}

function cryptoRandomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex')
}