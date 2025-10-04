import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'
import process from 'node:process'

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} = process.env ?? {}

export const getRedis = (overrides: Partial<RedisOptions> = {}) => {
  return new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 200, 3000)
    },
    reconnectOnError(err) {
      return err?.message?.includes('READONLY') || (err as any)?.code === 'ECONNRESET'
    },
    ...overrides,
  })
}

export async function redisHealthCheck(timeoutMs = 1500) {
  const healthClient = getRedis({
    enableOfflineQueue: false,
    autoResubscribe: false,
    autoResendUnfulfilledCommands: false,
    maxRetriesPerRequest: 0,
    connectTimeout: 1000,
    retryStrategy(times) {
      return Math.min(times * 200, 1000)
    },
  })

  try {
    const pingPromise = (async () => {
      await healthClient.connect()
      const pong = await healthClient.ping()
      return pong
    })()

    const pong = await Promise.race<string>([
      pingPromise,
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ])
    if (pong === 'PONG') {
      return { ok: true }
    }
    return { ok: false, error: `unexpected ping response: ${pong}` }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : String(err)
    return { ok: false, error: message }
  } finally {
    healthClient.disconnect()
  }
}
