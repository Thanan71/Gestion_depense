import 'dotenv/config'
import pg from 'pg'

const connectionString = process.env.DATABASE_READONLY_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('Missing DATABASE_READONLY_URL or DATABASE_URL.')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

try {
  const { rows } = await pool.query(
    'select current_database() as database, current_user as user_name, now() as checked_at'
  )
  console.log(
    `Connected to ${rows[0].database} as ${rows[0].user_name} at ${rows[0].checked_at.toISOString()}`
  )
} finally {
  await pool.end()
}
