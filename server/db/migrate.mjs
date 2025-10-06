import mysql from 'mysql2/promise'
import fs from 'node:fs'
import path from 'node:path'

function loadDotEnv() {
  const envPath = path.resolve('.env')
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch {
    // No .env, ignore
  }
}

loadDotEnv()

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} = process.env

if (!MYSQL_HOST || !MYSQL_PORT || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
  console.error('Missing MySQL env vars. Required: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE')
  process.exit(1)
}

const MIGRATIONS_DIR = path.resolve('server/db/migrations')

async function ensureDatabase() {
  const conn = await mysql.createConnection({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    multipleStatements: true,
  })
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
  } finally {
    await conn.end()
  }
}

async function getDb() {
  return mysql.createConnection({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    multipleStatements: true,
  })
}

async function ensureMigrationsTable(conn) {
  const initPath = path.join(MIGRATIONS_DIR, '0000_init.sql')
  const sql = fs.readFileSync(initPath, 'utf8')
  await conn.query(sql)
}

async function appliedVersions(conn) {
  try {
    const [rows] = await conn.query('SELECT version FROM schema_migrations ORDER BY version')
    return new Set(rows.map(r => String(r.version)))
  } catch (e) {
    // If table doesn't exist yet, create it and return empty set
    await ensureMigrationsTable(conn)
    const [rows] = await conn.query('SELECT version FROM schema_migrations ORDER BY version')
    return new Set(rows.map(r => String(r.version)))
  }
}

function listMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
  return files
    .filter(f => /^(\d{4})_.*\.sql$/.test(f))
    .sort((a, b) => a.localeCompare(b))
}

async function applyMigration(conn, file) {
  const match = file.match(/^(\d{4})_(.*)\.sql$/)
  const version = match?.[1]
  const name = match?.[2] ?? file
  if (!version) throw new Error(`Invalid migration filename: ${file}`)
  const sqlPath = path.join(MIGRATIONS_DIR, file)
  const sql = fs.readFileSync(sqlPath, 'utf8')
  await conn.beginTransaction()
  try {
    await conn.query(sql)
    await conn.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [version, name])
    await conn.commit()
    console.log(`Applied migration ${version} ${name}`)
  } catch (e) {
    await conn.rollback()
    throw e
  }
}

async function main() {
  await ensureDatabase()
  const conn = await getDb()
  try {
    await ensureMigrationsTable(conn)
    const applied = await appliedVersions(conn)
    const files = listMigrationFiles()
    for (const f of files) {
      const v = f.slice(0, 4)
      if (applied.has(v)) {
        continue
      }
      await applyMigration(conn, f)
    }
    console.log('All migrations applied.')
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})