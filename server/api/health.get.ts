import { mysqlHealthCheck } from '../utils/db'
import { redisHealthCheck } from '../utils/redis'

export default defineEventHandler(async () => {
  try {
    const [mysql, redis] = await Promise.all([
      mysqlHealthCheck().then(() => ({ ok: true })).catch((e) => ({ ok: false, error: String(e) })),
      redisHealthCheck(),
    ])
    return {
      mysql,
      redis,
      timestamp: new Date().toISOString(),
    }
  } catch (e) {
    return {
      error: String(e),
    }
  }
})