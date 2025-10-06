import { defineEventHandler, readBody } from 'h3'
import { replyError, validateEmail } from '../../../utils/auth'
import { verifyOtp } from '../../../utils/otp'
import { getMySqlPool } from '../../../utils/db'
import { verifyPassword } from '../../../utils/password'
import { createAppSession } from '../../../utils/session'
import { getRedis } from '../../../utils/redis'

function getEnvNumber(name: string, fallback: number): number {
  const v = process.env[name]
  const n = v == null || v === '' ? NaN : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function getLoginAttemptsMax(): number {
  return Math.max(0, getEnvNumber('LOGIN_ATTEMPTS_MAX', 0))
}

function getLoginAttemptsWindowSeconds(): number {
  return Math.max(60, getEnvNumber('LOGIN_ATTEMPTS_WINDOW_SECONDS', 900))
}

function attemptsKey(email: string) {
  return `login:attempts:${email}`
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const email = String(body?.email || '')
    const password = String(body?.password || '')
    const code = String(body?.code || '').trim()

    if (!validateEmail(email)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_email_format')
    }
    if (!password || password.trim().length === 0) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_password_empty')
    }
    if (!/^\d{6}$/.test(code)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_code_format')
    }

    const max = getLoginAttemptsMax()
    const windowSec = getLoginAttemptsWindowSeconds()
    const redis = getRedis()
    if (max > 0) {
      const raw = await redis.get(attemptsKey(email))
      const current = raw ? Number(raw) : 0
      if (current >= max) {
        const ttl = await redis.ttl(attemptsKey(email))
        const retryAfter = ttl >= 0 ? ttl : windowSec
        return replyError(event, 429, 'auth_attempts_exceeded', '尝试次数过多，请稍后再试', { retryAfterSeconds: retryAfter })
      }
    }

    const pool = getMySqlPool()
    const [rows] = await pool.execute(
      'SELECT id, email, password, nickname, status FROM users WHERE email = ? LIMIT 1',
      [email]
    ) as any
    const user = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
    if (!user) {
      if (max > 0) await recordAttempt(redis, email, windowSec)
      return replyError(event, 404, 'user_not_found', '用户不存在')
    }
    if (String(user.status) !== 'active') {
      if (max > 0) await recordAttempt(redis, email, windowSec)
      return replyError(event, 403, 'user_locked', '用户已被锁定或不可用')
    }

    const okPwd = await verifyPassword(password, String(user.password))
    if (!okPwd) {
      if (max > 0) await recordAttempt(redis, email, windowSec)
      return replyError(event, 401, 'password_incorrect', '密码错误')
    }

    const v = await verifyOtp('login', email, code)
    if (!v.ok) {
      if (max > 0) await recordAttempt(redis, email, windowSec)
      if (v.reason === 'expired') {
        return replyError(event, 400, 'otp_expired', '验证码已过期，请重新获取')
      }
      if (v.reason === 'attempts_exceeded') {
        return replyError(event, 429, 'otp_attempts_exceeded', '尝试次数过多，请重新获取验证码', { remainingAttempts: 0 })
      }
      return replyError(event, 400, 'otp_mismatch', '验证码错误', { remainingAttempts: v.remainingAttempts })
    }

    // 创建会话
    const { ttlSeconds } = await createAppSession(event, { userId: Number(user.id), email: String(user.email) })

    // 更新登录时间
    await pool.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id])

    // 清理失败计数
    if (max > 0) await redis.del(attemptsKey(email))

    return {
      ok: true,
      user: { id: Number(user.id), email: String(user.email), nickname: user.nickname ?? null },
      ttlSeconds,
    }
  } catch (err: any) {
    return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', err?.message || String(err))
  }
})

async function recordAttempt(redis: any, email: string, windowSec: number) {
  const key = attemptsKey(email)
  const next = await redis.incr(key)
  if (next === 1) {
    await redis.expire(key, windowSec)
  }
}