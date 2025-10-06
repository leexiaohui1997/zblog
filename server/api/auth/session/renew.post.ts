import { defineAuthEventHandler } from '../../../utils/handlers/auth'
import { renewAppSession } from '../../../utils/session'
import { replyError } from '../../../utils/auth'

export default defineAuthEventHandler(async (event) => {
  try {
    const r = await renewAppSession(event)
    if (!r.ok) {
      return replyError(event, 401, 'session_invalid', '会话无效或已过期')
    }
    return { ok: true, ttlSeconds: r.ttlSeconds }
  } catch (err: any) {
    return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', err?.message || String(err))
  }
})
