import crypto from 'node:crypto'
import { getRedis } from './redis'

type Scene = 'register' | 'login'

function getEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  const n = raw == null || raw === '' ? NaN : Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function getOtpTtlSeconds(): number {
  return Math.max(30, getEnvNumber('OTP_TTL_SECONDS', 600))
}

function getCooldownSeconds(): number {
  return Math.max(0, getEnvNumber('OTP_SEND_COOLDOWN_SECONDS', 60))
}

function getPerMinuteLimit(): number {
  return Math.max(1, getEnvNumber('OTP_SEND_LIMIT_PER_MINUTE', 3))
}

function getVerifyMaxAttempts(): number {
  // 0 表示不限制
  return Math.max(0, getEnvNumber('OTP_VERIFY_MAX_ATTEMPTS', 5))
}

function minuteBucket(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}${m}${day}${hh}${mm}`
}

function keyOtp(scene: Scene, email: string) {
  return `otp:${scene}:code:${email}`
}

function keyCooldown(scene: Scene, email: string) {
  return `otp:${scene}:cooldown:${email}`
}

function keyMinuteQuota(scene: Scene, email: string) {
  return `otp:${scene}:quota:${email}:${minuteBucket()}`
}

function keyAttempts(scene: Scene, email: string) {
  return `otp:${scene}:attempts:${email}`
}

function generateNumericCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += String(crypto.randomInt(0, 10))
  }
  return code
}

function hashCode(code: string, salt: string): string {
  const h = crypto.createHash('sha256')
  h.update(salt)
  h.update(code)
  return h.digest('hex')
}

export interface RequestOtpResultOk {
  ok: true
  code: string
  ttlSeconds: number
  cooldownUntilISO: string
}

export interface RequestOtpResultErr {
  ok: false
  reason: 'cooldown' | 'rate_limit'
  cooldownUntilISO?: string
  retryAfterSeconds?: number
}

export type RequestOtpResult = RequestOtpResultOk | RequestOtpResultErr

export async function requestOtp(scene: Scene, email: string): Promise<RequestOtpResult> {
  const redis = getRedis()
  const ttlSec = getOtpTtlSeconds()
  const cooldownSec = getCooldownSeconds()
  const perMinuteLimit = getPerMinuteLimit()

  // 冷却检查
  const cdKey = keyCooldown(scene, email)
  const cdTtl = await redis.ttl(cdKey)
  if (cdTtl > 0) {
    const until = new Date(Date.now() + cdTtl * 1000).toISOString()
    return { ok: false, reason: 'cooldown', cooldownUntilISO: until }
  }

  // 每分钟限额
  const quotaKey = keyMinuteQuota(scene, email)
  const quota = await redis.incr(quotaKey)
  if (quota === 1) {
    await redis.expire(quotaKey, 60)
  }
  if (quota > perMinuteLimit) {
    const retryAfter = await redis.ttl(quotaKey)
    return { ok: false, reason: 'rate_limit', retryAfterSeconds: retryAfter >= 0 ? retryAfter : 60 }
  }

  // 生成并存储哈希
  const code = generateNumericCode(6)
  const salt = crypto.randomBytes(16).toString('hex')
  const h = hashCode(code, salt)

  const otpKey = keyOtp(scene, email)
  const payload = JSON.stringify({ h, salt })
  await redis.set(otpKey, payload, 'EX', ttlSec)

  // 设置冷却
  const cooldownUntilISO = new Date(Date.now() + cooldownSec * 1000).toISOString()
  if (cooldownSec > 0) {
    await redis.set(cdKey, '1', 'EX', cooldownSec)
  }

  return { ok: true, code, ttlSeconds: ttlSec, cooldownUntilISO }
}

export interface VerifyOtpOk {
  ok: true
}

export interface VerifyOtpErr {
  ok: false
  reason: 'expired' | 'mismatch' | 'attempts_exceeded'
  remainingAttempts?: number
}

export type VerifyOtpResult = VerifyOtpOk | VerifyOtpErr

export async function verifyOtp(scene: Scene, email: string, code: string): Promise<VerifyOtpResult> {
  const redis = getRedis()
  const maxAttempts = getVerifyMaxAttempts()

  const attemptsKey = keyAttempts(scene, email)
  if (maxAttempts > 0) {
    const currentAttemptsRaw = await redis.get(attemptsKey)
    const currentAttempts = currentAttemptsRaw ? Number(currentAttemptsRaw) : 0
    if (currentAttempts >= maxAttempts) {
      return { ok: false, reason: 'attempts_exceeded', remainingAttempts: 0 }
    }
  }

  const otpKey = keyOtp(scene, email)
  const payload = await redis.get(otpKey)
  if (!payload) {
    return { ok: false, reason: 'expired' }
  }

  let data: { h: string, salt: string } | null = null
  try {
    data = JSON.parse(payload)
  } catch {
    // 数据损坏，视为过期
    return { ok: false, reason: 'expired' }
  }

  const expected = data!.h
  const actual = hashCode(code, data!.salt)
  if (expected !== actual) {
    // 累计失败次数，过期时间与验证码一致
    const ttl = await redis.ttl(otpKey)
    const next = await redis.incr(attemptsKey)
    if (next === 1 && ttl > 0) {
      await redis.expire(attemptsKey, ttl)
    }
    const remaining = maxAttempts > 0 ? Math.max(0, maxAttempts - next) : undefined
    return { ok: false, reason: 'mismatch', remainingAttempts: remaining }
  }

  // 验证成功，清理数据
  await redis.del(otpKey)
  await redis.del(attemptsKey)
  return { ok: true }
}