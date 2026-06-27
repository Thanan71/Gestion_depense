import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('Missing DATABASE_URL.')
  process.exit(1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schema = await readFile(resolve(root, 'database/schema.sql'), 'utf8')
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

try {
  await pool.query(schema)
  console.log('PostgreSQL schema is up to date.')
} finally {
  await pool.end()
}
