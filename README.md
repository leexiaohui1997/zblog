# ZBlog

## 项目简介

- 基于 Nuxt 4 构建的博客应用。
- 技术栈：Nuxt 4、H3、Redis、MySQL、Nodemailer、EJS。

## 命令参考

前置环境：安装 Node.js（推荐 LTS）与 pnpm。

```bash
# 安装依赖
pnpm install

# 启动开发服务（默认 http://localhost:3000）
pnpm dev

# 生产构建
pnpm build

# 预览构建产物
pnpm preview

# 静态生成（如需）
pnpm generate

# 执行数据库迁移
pnpm db:migrate
```

注意事项：
- 启动前需配置 `.env` 并确保 MySQL 与 Redis 可用。
- 邮件发送依赖 SMTP 环境变量，请正确配置并与服务商设置匹配。

## 环境配置

将 `.env.example` 复制为 `.env` 并按需填写，按分组说明如下：

### 项目

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `PROJECT_NAME` | 应用名，用于邮件标题与发件人名回退 | `ZBlog` |

### 数据库（MySQL）

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `MYSQL_HOST` | 数据库主机 | `127.0.0.1` |
| `MYSQL_PORT` | 数据库端口 | `3306` |
| `MYSQL_ROOT_PASSWORD` | Root 用户密码 | `secret` |
| `MYSQL_DATABASE` | 数据库名称 | `zblog` |
| `MYSQL_USER` | 应用数据库用户 | `zblog` |
| `MYSQL_PASSWORD` | 应用数据库用户密码 | `secret` |

### Redis

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `REDIS_HOST` | Redis 主机 | `127.0.0.1` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | `secret` |

### 会话

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `SESSION_COOKIE_NAME` | 会话 Cookie 名称 | `sid` |
| `SESSION_TTL_SECONDS` | 会话有效期（秒） | `86400` |
| `SESSION_SECURE` | 仅在 HTTPS 发送 Cookie | `true` |

### OTP（验证码）

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `OTP_CODE_LENGTH` | 验证码长度 | `6` |
| `OTP_TTL_SECONDS` | 验证码有效期（秒） | `300` |
| `OTP_SEND_COOLDOWN_SECONDS` | 发送冷却时间（秒） | `60` |
| `OTP_SEND_LIMIT_PER_MINUTE` | 每分钟发送上限 | `3` |
| `OTP_VERIFY_MAX_ATTEMPTS` | 最大验证失败次数（`0` 不限制） | `5` |

### SMTP（发信通道）

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `SMTP_HOST` | SMTP 主机 | `smtp.example.com` |
| `SMTP_PORT` | SMTP 端口 | `587` 或 `465` |
| `SMTP_SECURE` | 是否启用 TLS（465 通常为 `true`） | `true`/`false` |
| `SMTP_USER` | SMTP 用户名 | `user@example.com` |
| `SMTP_PASSWORD` | SMTP 密码 | `secret` |

### 邮件发件人

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `MAIL_FROM` | 发件人邮箱地址 | `no-reply@example.com` |
| `MAIL_FROM_NAME` | 发件人名称（未设置时回退 `PROJECT_NAME`） | `ZBlog` |

配置建议：
- SMTP 端口与 `SMTP_SECURE` 保持匹配（如 465/true，587/false），确保凭据有效。
- 生产环境建议开启 `SESSION_SECURE=true` 并使用 HTTPS，谨慎管理密钥与环境变量。
