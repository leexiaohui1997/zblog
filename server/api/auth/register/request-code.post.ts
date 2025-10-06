import { defineEventHandler, readBody } from 'h3'
import { renderEmail } from '../../../utils/mail'
import { replyError, validateEmail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const email = String(body?.email || '')
    if (!validateEmail(email)) {
      return replyError(event, 400, 'auth_invalid_input', '输入不合法', 'invalid_email_format')
    }

    const { html, context } = await renderEmail('register', { scene: 'register' })
    return {
      ok: true,
      template: { html },
      context,
    }
  } catch (err: any) {
    return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', err?.message || String(err))
  }
})