import mysql from 'mysql2/promise'
import process from 'node:process'

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_PASSWORD,
} = process.env ?? {}

export const getMySqlPool = () => {
  const pool = mysql.createPool({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  })
  return pool
}

export async function mysqlHealthCheck() {
  const pool = getMySqlPool()
  const [rows] = await pool.execute('SELECT 1 AS ok')
  return { ok: true, rows }
}