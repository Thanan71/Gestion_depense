import pg from 'pg'

const { Pool } = pg

const createPool = (connectionString?: string) => {
  if (!connectionString) {
    throw new Error('Missing PostgreSQL connection string.')
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000
  })
}

let readWritePool: pg.Pool | undefined
let readOnlyPool: pg.Pool | undefined

export const getReadWritePool = () => {
  readWritePool ??= createPool(process.env.DATABASE_URL)
  return readWritePool
}

export const getReadOnlyPool = () => {
  readOnlyPool ??= createPool(process.env.DATABASE_READONLY_URL ?? process.env.DATABASE_URL)
  return readOnlyPool
}

export const closePools = async () => {
  await Promise.all([readWritePool?.end(), readOnlyPool?.end()])
  readWritePool = undefined
  readOnlyPool = undefined
}
