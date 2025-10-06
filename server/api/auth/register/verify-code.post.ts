import { defineEventHandler, readBody } from 'h3'
import { replyError, validateEmail } from '../../../utils/auth'
import { verifyOtp } from '../../../utils/otp'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const email = String(body?.email || '')
    const code = String(body?.code || '').trim()

    if (!validateEmail(email)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_email_format')
    }
    if (!/^\d{6}$/.test(code)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_code_format')
    }

    const res = await verifyOtp('register', email, code)
    if (res.ok) {
      return { ok: true }
    }

    if (res.reason === 'expired') {
      return replyError(event, 400, 'otp_expired', '验证码已过期，请重新获取')
    }
    if (res.reason === 'attempts_exceeded') {
      return replyError(event, 429, 'otp_attempts_exceeded', '尝试次数过多，请重新获取验证码', { remainingAttempts: 0 })
    }
    return replyError(event, 400, 'otp_mismatch', '验证码错误', { remainingAttempts: res.remainingAttempts })
  } catch (err: any) {
    return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', err?.message || String(err))
  }
})