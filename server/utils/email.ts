import nodemailer from 'nodemailer'

function getEnv(name: string, fallback?: string) {
  const v = process.env[name]
  return v == null || v === '' ? fallback : v
}

export function createTransport() {
  const host = getEnv('SMTP_HOST')
  const port = Number(getEnv('SMTP_PORT', '587'))
  const secure = String(getEnv('SMTP_SECURE', 'false')).toLowerCase() === 'true'
  const user = getEnv('SMTP_USER')
  const pass = getEnv('SMTP_PASSWORD')
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  })
  return transporter
}

export async function sendMail(options: { to: string, subject: string, html: string }) {
  const fromEmail = getEnv('MAIL_FROM') || 'no-reply@example.com'
  const fromName = getEnv('MAIL_FROM_NAME') || (getEnv('PROJECT_NAME') || 'ZBlog')
  const transporter = createTransport()
  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
  return { messageId: info.messageId }
}