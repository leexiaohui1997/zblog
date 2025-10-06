import path from 'node:path'
import fs from 'node:fs/promises'
import * as ejs from 'ejs'

type Scene = 'register' | 'login'

export interface RenderContext {
  appName: string
  code: string
  ttlMinutes: number
  scene: Scene
  now: string
  supportEmail?: string
  helpers?: {
    uppercase: (s: string) => string
    spacedCode: (code: string) => string
  }
}

const helpers = {
  uppercase: (s: string) => String(s).toUpperCase(),
  spacedCode: (code: string) => String(code).split('').join(' '),
}

function getAppName(): string {
  return process.env.APP_NAME || 'ZBlog'
}

function getTtlMinutes(): number {
  const sec = Number(process.env.OTP_TTL_SECONDS || 600)
  return Math.max(1, Math.round(sec / 60))
}

function getTemplatePath(scene: Scene) {
  const filename = scene === 'register' ? 'RegisterEmail.ejs' : 'LoginEmail.ejs'
  return path.resolve(process.cwd(), 'server', 'assets', 'mail', filename)
}

export async function renderEmail(scene: Scene, ctx?: Partial<RenderContext>): Promise<{ html: string, context: RenderContext }> {
  const baseCtx: RenderContext = {
    appName: getAppName(),
    code: '000000',
    ttlMinutes: getTtlMinutes(),
    scene,
    now: new Date().toISOString(),
    supportEmail: process.env.SUPPORT_EMAIL,
    helpers,
  }

  const fullCtx: RenderContext = { ...baseCtx, ...(ctx || {}), helpers }

  const tplPath = getTemplatePath(scene)
  const tplStr = await fs.readFile(tplPath, 'utf8')
  const html = ejs.render(tplStr, fullCtx, { rmWhitespace: true })
  return { html, context: fullCtx }
}