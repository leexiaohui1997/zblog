import { setResponseStatus } from 'h3'

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function replyError(event: any, statusCode: number, code: string, messageZh: string, errorDetail?: any) {
  setResponseStatus(event, statusCode)
  return {
    ok: false,
    code,
    message: messageZh,
    error: errorDetail ?? null,
  }
}
