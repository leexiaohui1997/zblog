import { defineAuthEventHandler } from '../../../utils/handlers/auth'
import { destroyAppSession } from '../../../utils/session'
import { replyError } from '../../../utils/auth'

export default defineAuthEventHandler(async (event) => {
  try {
    await destroyAppSession(event)
    return { ok: true }
  } catch (err: any) {
    return replyError(event, 500, 'auth_internal_error', '服务异常，请稍后再试', err?.message || String(err))
  }
})
