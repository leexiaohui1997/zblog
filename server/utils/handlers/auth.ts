import { defineEventHandler } from 'h3'
import type { H3Event, EventHandlerRequest, H3EventContext } from 'h3'
import { replyError } from '../../utils/auth'

export type AuthenticatedEvent<Req extends EventHandlerRequest = EventHandlerRequest> = Omit<H3Event<Req>, 'context'> & {
  context: Omit<H3EventContext, 'auth'> & { auth: NonNullable<H3EventContext['auth']> }
}

export function defineAuthEventHandler<Req extends EventHandlerRequest = EventHandlerRequest, Res = any>(
  fn: (event: AuthenticatedEvent<Req>) => Promise<Res> | Res
) {
  return defineEventHandler(async (event: H3Event<Req>) => {
    const auth = event.context.auth
    if (!auth) {
      return replyError(event as any, 401, 'unauthorized', '未登录')
    }
    return fn(event as AuthenticatedEvent<Req>)
  })
}
