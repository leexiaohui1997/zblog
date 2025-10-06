import type { AppSessionRecord } from './session'

declare module 'h3' {
  interface H3EventContext {
    auth: ({ sid: string, data: AppSessionRecord['data'] } | null)
  }
}