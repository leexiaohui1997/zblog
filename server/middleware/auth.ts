import { defineEventHandler } from 'h3'
import { getAppSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  // 仅应用到 API 路径
  if (!path.startsWith('/api/')) {
    // 非 API 请求也保持 auth 字段可用（为 null），但不做 Redis 查询
    event.context.auth = null
    return
  }

  const session = await getAppSession(event)
  if (!session) {
    event.context.auth = null
    return
  }
  event.context.auth = { sid: session.sid, data: session.data }
})
