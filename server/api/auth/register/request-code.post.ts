import { defineEventHandler, readBody } from 'h3'
import { renderEmail } from '../../../utils/mail'
import { replyError, validateEmail } from '../../../utils/auth'
import { requestOtp } from '../../../utils/otp'
import { sendMail } from '../../../utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const email = String(body?.email || '')
    if (!validateEmail(email)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_email_format')
    }

    const otp = await requestOtp('register', email)
    if (!otp.ok) {
      if (otp.reason === 'cooldown') {
        return replyError(event, 429, 'otp_cooldown', '发送过于频繁，请稍后再试', { cooldownUntil: otp.cooldownUntilISO })
      }
      return replyError(event, 429, 'otp_rate_limit', '当前发送频率过高，请稍后再试', { retryAfterSeconds: otp.retryAfterSeconds })
    }

    const { html } = await renderEmail('register', {
      scene: 'register',
      code: otp.code,
      ttlMinutes: Math.max(1, Math.round(otp.ttlSeconds / 60)),
      now: new Date().toISOString(),
    })

    try {
      const appName = process.env.PROJECT_NAME || 'ZBlog'
      await sendMail({ to: email, subject: `${appName} · 注册验证码`, html })
    } catch (err: any) {
      return replyError(event, 500, 'mail_send_failed', '邮件发送失败，请稍后再试', err?.message || String(err))
    }

    return {
      ok: true,
      cooldownUntil: otp.cooldownUntilISO,
    }
  } catch (err: any) {
    return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', err?.message || String(err))
  }
})