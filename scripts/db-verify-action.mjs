import 'dotenv/config'
import { mkdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import pg from 'pg'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tempDir = resolve(tmpdir(), `gestion-depense-db-verify-${Date.now()}`)
const bundledFunction = resolve(tempDir, 'app-data.cjs')
const require = createRequire(import.meta.url)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const callFunction = async (handler, method, body) => {
  const response = await handler({
    httpMethod: method,
    body: body ? JSON.stringify(body) : null,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    path: '/.netlify/functions/app-data',
    rawUrl: 'http://localhost/.netlify/functions/app-data',
    rawQuery: '',
    isBase64Encoded: false
  })

  const parsedBody = JSON.parse(response.body || '{}')
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(parsedBody.message ?? `Function returned ${response.statusCode}`)
  }

  return parsedBody
}

try {
  await mkdir(tempDir, { recursive: true })
  await build({
    entryPoints: [resolve(root, 'netlify/functions/app-data.ts')],
    outfile: bundledFunction,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: ['pg-native']
  })

  const { handler } = require(bundledFunction)
  const previous = await callFunction(handler, 'GET')
  const verificationId = `expense-db-verify-${Date.now()}`
  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stores: {
      expenses: {
        expenses: [
          {
            id: verificationId,
            kind: 'expense',
            title: 'Vérification BDD',
            description: 'Action simulée depuis le site',
            amount: 12.34,
            date: new Date().toISOString().slice(0, 10),
            time: '12:00',
            categoryId: 'misc',
            accountId: 'current',
            paymentMethod: 'CB',
            tags: ['verification'],
            recurrence: 'none',
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        query: '',
        categoryFilter: 'all',
        periodFilter: 'month'
      }
    }
  }

  await callFunction(handler, 'PUT', snapshot)

  const { rows } = await pool.query(
    "select data #>> '{stores,expenses,expenses,0,id}' as expense_id from app_snapshots where id = 'default'"
  )

  if (rows[0]?.expense_id !== verificationId) {
    throw new Error('The simulated site action was not found in PostgreSQL.')
  }

  if (previous.snapshot) {
    await callFunction(handler, 'PUT', previous.snapshot)
  } else {
    await pool.query("delete from app_snapshots where id = 'default'")
  }

  console.log(`Site action persisted in PostgreSQL via Netlify Function: ${verificationId}`)
} finally {
  await pool.end()
  await rm(tempDir, { recursive: true, force: true })
}
