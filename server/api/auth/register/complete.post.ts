import { defineEventHandler, readBody } from 'h3'
import { replyError, validateEmail } from '../../../utils/auth'
import { verifyOtp } from '../../../utils/otp'
import { getMySqlPool } from '../../../utils/db'
import { hashPassword } from '../../../utils/password'

function validatePassword(pwd: string): boolean {
  if (typeof pwd !== 'string') return false
  const s = pwd.trim()
  if (s.length < 8) return false
  const hasLetter = /[A-Za-z]/.test(s)
  const hasDigit = /\d/.test(s)
  return hasLetter && hasDigit
}

function validateNickname(nickname?: string): boolean {
  if (!nickname) return true
  const s = String(nickname).trim()
  if (s.length === 0) return true
  if (s.length < 2 || s.length > 32) return false
  return /^[A-Za-z0-9_\-\u4e00-\u9fa5]+$/.test(s)
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const email = String(body?.email || '')
    const code = String(body?.code || '').trim()
    const password = String(body?.password || '')
    const nicknameRaw = body?.nickname
    const nickname = nicknameRaw == null ? null : String(nicknameRaw).trim() || null

    if (!validateEmail(email)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_email_format')
    }
    if (!/^\d{6}$/.test(code)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_code_format')
    }
    if (!validatePassword(password)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'weak_password')
    }
    if (!validateNickname(nickname ?? undefined)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_nickname_format')
    }

    // 验证验证码（消费）
    const v = await verifyOtp('register', email, code)
    if (!v.ok) {
      if (v.reason === 'expired') {
        return replyError(event, 400, 'otp_expired', '验证码已过期，请重新获取')
      }
      if (v.reason === 'attempts_exceeded') {
        return replyError(event, 429, 'otp_attempts_exceeded', '尝试次数过多，请重新获取验证码', { remainingAttempts: 0 })
      }
      return replyError(event, 400, 'otp_mismatch', '验证码错误', { remainingAttempts: v.remainingAttempts })
    }

    const pool = getMySqlPool()

    // 检查邮箱占用
    const [existsRows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]) as any
    if (Array.isArray(existsRows) && existsRows.length > 0) {
      return replyError(event, 409, 'auth_email_already_exists', '邮箱已被占用')
    }

    // 检查昵称占用（非空时）
    if (nickname) {
      const [nkRows] = await pool.execute('SELECT 1 FROM users WHERE nickname = ? LIMIT 1', [nickname]) as any
      if (Array.isArray(nkRows) && nkRows.length > 0) {
        return replyError(event, 409, 'auth_nickname_taken', '昵称已被占用')
      }
    }

    const passwordHash = await hashPassword(password)

    try {
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, nickname, status, email_verified, created_at, updated_at) VALUES (?, ?, ?, \'active\', 1, NOW(), NOW())',
        [email, passwordHash, nickname]
      ) as any
      const userId = Number(result?.insertId)
      return { ok: true, userId }
    } catch (err: any) {
      // 处理潜在唯一索引冲突
      const msg = err?.message || ''
      if (/uniq_email/i.test(msg) || /Duplicate entry/.test(msg)) {
        return replyError(event, 409, 'auth_email_already_exists', '邮箱已被占用')
      }
      return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', msg)
    }
  } catch (err: any) {
    return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', err?.message || String(err))
  }
})