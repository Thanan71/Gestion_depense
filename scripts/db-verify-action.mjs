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
  const now = new Date().toISOString()
  const snapshot = {
    version: 2,
    exportedAt: now,
    stores: {
      accounts: {
        accounts: [{ id: 'current', name: 'Compte courant', type: 'bank', balance: 0 }]
      },
      categories: {
        categories: [{ id: 'misc', name: 'Divers', icon: 'Boxes', color: '#475569' }]
      },
      budgets: {
        budgets: [
          {
            id: `budget-db-verify-${Date.now()}`,
            name: 'Budget vérification',
            amount: 500,
            period: 'monthly',
            categoryId: 'misc',
            alertThreshold: 80,
            createdAt: now,
            updatedAt: now
          }
        ]
      },
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
            createdAt: now,
            updatedAt: now
          }
        ],
        query: '',
        categoryFilter: 'all',
        periodFilter: 'month'
      },
      income: { income: [] },
      goals: {
        goals: [
          {
            id: `goal-db-verify-${Date.now()}`,
            name: 'Objectif vérification',
            targetAmount: 1000,
            currentAmount: 100,
            icon: 'Target',
            createdAt: now,
            updatedAt: now
          }
        ]
      },
      subscriptions: {
        subscriptions: [
          {
            id: `subscription-db-verify-${Date.now()}`,
            name: 'Abonnement vérification',
            amount: 9.99,
            renewalDate: new Date().toISOString().slice(0, 10),
            recurrence: 'monthly',
            notifyBeforeDays: 1,
            categoryId: 'misc',
            createdAt: now,
            updatedAt: now
          }
        ]
      },
      debts: {
        debts: [
          {
            id: `debt-db-verify-${Date.now()}`,
            person: 'Vérification',
            amount: 25,
            direction: 'owed_to_me',
            history: [{ date: new Date().toISOString().slice(0, 10), amount: 25, note: 'Test' }],
            createdAt: now,
            updatedAt: now
          }
        ]
      },
      settings: {
        settings: {
          currency: 'EUR',
          locale: 'fr-FR',
          theme: 'auto',
          dateFormat: 'DD/MM/YYYY',
          weekStartsOn: 1,
          notifications: {
            budgetExceeded: true,
            newExpense: true,
            goalReached: true,
            subscriptionTomorrow: true
          },
          dashboardWidgets: ['balance']
        }
      }
    }
  }

  await callFunction(handler, 'PUT', snapshot)

  const { rows } = await pool.query('select id, title, kind from transactions where id = $1', [
    verificationId
  ])

  if (rows[0]?.id !== verificationId || rows[0]?.kind !== 'expense') {
    throw new Error('The simulated site action was not found in PostgreSQL.')
  }

  const tableChecks = await pool.query(`
    select
      (select count(*)::int from app_users) as app_users,
      (select count(*)::int from accounts) as accounts,
      (select count(*)::int from categories) as categories,
      (select count(*)::int from budgets) as budgets,
      (select count(*)::int from transactions) as transactions,
      (select count(*)::int from goals) as goals,
      (select count(*)::int from subscriptions) as subscriptions,
      (select count(*)::int from debts) as debts,
      (select count(*)::int from settings) as settings
  `)

  const missingTables = Object.entries(tableChecks.rows[0])
    .filter(([, count]) => Number(count) < 1)
    .map(([table]) => table)

  if (missingTables.length) {
    throw new Error(`The sync did not write every expected table: ${missingTables.join(', ')}`)
  }

  if (previous.snapshot) {
    await callFunction(handler, 'PUT', previous.snapshot)
  } else {
    await callFunction(handler, 'PUT', {
      version: 2,
      exportedAt: new Date().toISOString(),
      stores: {
        accounts: { accounts: [] },
        categories: { categories: [] },
        budgets: { budgets: [] },
        expenses: { expenses: [], query: '', categoryFilter: 'all', periodFilter: 'month' },
        income: { income: [] },
        goals: { goals: [] },
        subscriptions: { subscriptions: [] },
        debts: { debts: [] }
      }
    })
  }

  console.log(`Site action persisted in PostgreSQL normalized tables: ${verificationId}`)
} finally {
  await pool.end()
  await rm(tempDir, { recursive: true, force: true })
}
