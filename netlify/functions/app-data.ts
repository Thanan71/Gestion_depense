import type { Handler } from '@netlify/functions'
import type { PoolClient } from 'pg'

import { requireUser } from '../../src/server/auth.js'
import { getReadOnlyPool, getReadWritePool } from '../../src/server/database.js'
import type {
  Account,
  Budget,
  Category,
  Debt,
  Expense,
  Goal,
  Income,
  Settings,
  Subscription
} from '../../src/types/finance.js'
import type { AppSnapshot } from '../../src/types/sync.js'

type Transaction = Expense | Income

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
})

const isSnapshot = (value: unknown): value is AppSnapshot => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppSnapshot>
  return typeof candidate.version === 'number' && typeof candidate.stores === 'object'
}

const dateOnly = (value: unknown) => {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

const timeOnly = (value: unknown) => String(value ?? '00:00').slice(0, 5)
const numberValue = (value: unknown) => Number(value ?? 0)
const textArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : [])
const dbId = (userId: string, id?: string | null) => (id ? `${userId}:${id}` : null)
const appId = (userId: string, id?: string | null) =>
  id?.startsWith(`${userId}:`) ? id.slice(userId.length + 1) : (id ?? undefined)

const pullSnapshot = async (userId: string): Promise<AppSnapshot | null> => {
  const pool = getReadOnlyPool()
  const [accounts, categories, budgets, transactions, goals, subscriptions, debts, settings] =
    await Promise.all([
      pool.query(
        'select id, name, type, balance from accounts where user_id = $1 order by created_at, id',
        [userId]
      ),
      pool.query(
        'select id, name, icon, color, parent_id, budget_id from categories where user_id = $1 order by created_at, id',
        [userId]
      ),
      pool.query(
        'select id, name, amount, period, category_id, alert_threshold, created_at, updated_at from budgets where user_id = $1 order by created_at, id',
        [userId]
      ),
      pool.query(
        'select id, kind, title, description, amount, date, time, category_id, sub_category_id, account_id, payment_method, tags, receipt_photo, location, recurrence, archived, created_at, updated_at from transactions where user_id = $1 order by date desc, time desc, created_at desc',
        [userId]
      ),
      pool.query(
        'select id, name, target_amount, current_amount, due_date, icon, created_at, updated_at from goals where user_id = $1 order by created_at, id',
        [userId]
      ),
      pool.query(
        'select id, name, amount, renewal_date, recurrence, notify_before_days, category_id, created_at, updated_at from subscriptions where user_id = $1 order by renewal_date, id',
        [userId]
      ),
      pool.query(
        'select id, person, amount, direction, due_date, history, created_at, updated_at from debts where user_id = $1 order by created_at, id',
        [userId]
      ),
      pool.query('select data from settings where user_id = $1', [userId])
    ])

  const hasRemoteData =
    accounts.rowCount ||
    categories.rowCount ||
    budgets.rowCount ||
    transactions.rowCount ||
    goals.rowCount ||
    subscriptions.rowCount ||
    debts.rowCount ||
    settings.rowCount

  if (!hasRemoteData) return null

  const mappedTransactions = transactions.rows.map((row): Transaction => {
    const base = {
      id: appId(userId, row.id) ?? row.id,
      kind: row.kind,
      title: row.title,
      description: row.description ?? '',
      amount: numberValue(row.amount),
      date: dateOnly(row.date) ?? new Date().toISOString().slice(0, 10),
      time: timeOnly(row.time),
      categoryId: appId(userId, row.category_id) ?? '',
      subCategoryId: appId(userId, row.sub_category_id),
      accountId: appId(userId, row.account_id) ?? '',
      paymentMethod: row.payment_method,
      tags: textArray(row.tags),
      receiptPhoto: row.receipt_photo ?? undefined,
      location: row.location ?? undefined,
      recurrence: row.recurrence,
      archived: Boolean(row.archived),
      createdAt: row.created_at?.toISOString?.() ?? String(row.created_at),
      updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at)
    }

    return row.kind === 'income'
      ? ({ ...base, kind: 'income' } as Income)
      : ({ ...base, kind: 'expense' } as Expense)
  })

  const stores: AppSnapshot['stores'] = {
    accounts: {
      accounts: accounts.rows.map(
        (row): Account => ({
          id: appId(userId, row.id) ?? row.id,
          name: row.name,
          type: row.type,
          balance: numberValue(row.balance)
        })
      )
    },
    categories: {
      categories: categories.rows.map(
        (row): Category => ({
          id: appId(userId, row.id) ?? row.id,
          name: row.name,
          icon: row.icon,
          color: row.color,
          parentId: appId(userId, row.parent_id),
          budgetId: appId(userId, row.budget_id)
        })
      )
    },
    budgets: {
      budgets: budgets.rows.map(
        (row): Budget => ({
          id: appId(userId, row.id) ?? row.id,
          name: row.name,
          amount: numberValue(row.amount),
          period: row.period,
          categoryId: appId(userId, row.category_id),
          alertThreshold: Number(row.alert_threshold),
          createdAt: row.created_at?.toISOString?.() ?? String(row.created_at),
          updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at)
        })
      )
    },
    expenses: {
      expenses: mappedTransactions.filter((transaction) => transaction.kind === 'expense'),
      query: '',
      categoryFilter: 'all',
      periodFilter: 'month'
    },
    income: {
      income: mappedTransactions.filter((transaction) => transaction.kind === 'income')
    },
    goals: {
      goals: goals.rows.map(
        (row): Goal => ({
          id: appId(userId, row.id) ?? row.id,
          name: row.name,
          targetAmount: numberValue(row.target_amount),
          currentAmount: numberValue(row.current_amount),
          dueDate: dateOnly(row.due_date),
          icon: row.icon,
          createdAt: row.created_at?.toISOString?.() ?? String(row.created_at),
          updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at)
        })
      )
    },
    subscriptions: {
      subscriptions: subscriptions.rows.map(
        (row): Subscription => ({
          id: appId(userId, row.id) ?? row.id,
          name: row.name,
          amount: numberValue(row.amount),
          renewalDate: dateOnly(row.renewal_date) ?? new Date().toISOString().slice(0, 10),
          recurrence: row.recurrence,
          notifyBeforeDays: Number(row.notify_before_days),
          categoryId: appId(userId, row.category_id),
          createdAt: row.created_at?.toISOString?.() ?? String(row.created_at),
          updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at)
        })
      )
    },
    debts: {
      debts: debts.rows.map(
        (row): Debt => ({
          id: appId(userId, row.id) ?? row.id,
          person: row.person,
          amount: numberValue(row.amount),
          direction: row.direction,
          dueDate: dateOnly(row.due_date),
          history: Array.isArray(row.history) ? row.history : [],
          createdAt: row.created_at?.toISOString?.() ?? String(row.created_at),
          updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at)
        })
      )
    }
  }

  if (settings.rows[0]?.data) {
    stores.settings = { settings: settings.rows[0].data as Settings }
  }

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    stores
  }
}

const replaceRemoteData = async (client: PoolClient, snapshot: AppSnapshot, userId: string) => {
  const accounts = (snapshot.stores.accounts?.accounts ?? []) as Account[]
  const categories = (snapshot.stores.categories?.categories ?? []) as Category[]
  const budgets = (snapshot.stores.budgets?.budgets ?? []) as Budget[]
  const expenses = (snapshot.stores.expenses?.expenses ?? []) as Expense[]
  const income = (snapshot.stores.income?.income ?? []) as Income[]
  const goals = (snapshot.stores.goals?.goals ?? []) as Goal[]
  const subscriptions = (snapshot.stores.subscriptions?.subscriptions ?? []) as Subscription[]
  const debts = (snapshot.stores.debts?.debts ?? []) as Debt[]
  const settings = snapshot.stores.settings?.settings as Settings | undefined

  await client.query('begin')
  try {
    const deleteOrder = [
      'transactions',
      'budgets',
      'subscriptions',
      'debts',
      'goals',
      'categories',
      'accounts',
      'settings'
    ]

    for (const table of deleteOrder) {
      await client.query(`delete from ${table} where user_id = $1`, [userId])
    }

    for (const account of accounts) {
      await client.query(
        'insert into accounts (id, user_id, name, type, balance) values ($1, $2, $3, $4, $5)',
        [dbId(userId, account.id), userId, account.name, account.type, account.balance]
      )
    }

    for (const category of categories) {
      await client.query(
        'insert into categories (id, user_id, name, icon, color) values ($1, $2, $3, $4, $5)',
        [dbId(userId, category.id), userId, category.name, category.icon, category.color]
      )
    }

    for (const category of categories) {
      await client.query(
        'update categories set parent_id = $3, budget_id = $4 where id = $1 and user_id = $2',
        [
          dbId(userId, category.id),
          userId,
          dbId(userId, category.parentId),
          dbId(userId, category.budgetId)
        ]
      )
    }

    for (const budget of budgets) {
      await client.query(
        'insert into budgets (id, user_id, name, amount, period, category_id, alert_threshold, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          dbId(userId, budget.id),
          userId,
          budget.name,
          budget.amount,
          budget.period,
          dbId(userId, budget.categoryId),
          budget.alertThreshold,
          budget.createdAt,
          budget.updatedAt
        ]
      )
    }

    for (const transaction of [...expenses, ...income]) {
      await client.query(
        'insert into transactions (id, user_id, kind, title, description, amount, date, time, category_id, sub_category_id, account_id, payment_method, tags, receipt_photo, location, recurrence, archived, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)',
        [
          dbId(userId, transaction.id),
          userId,
          transaction.kind,
          transaction.title,
          transaction.description,
          transaction.amount,
          transaction.date,
          transaction.time,
          dbId(userId, transaction.categoryId),
          dbId(userId, transaction.subCategoryId),
          dbId(userId, transaction.accountId),
          transaction.paymentMethod,
          transaction.tags,
          transaction.receiptPhoto ?? null,
          transaction.location ?? null,
          transaction.recurrence,
          transaction.archived,
          transaction.createdAt,
          transaction.updatedAt
        ]
      )
    }

    for (const goal of goals) {
      await client.query(
        'insert into goals (id, user_id, name, target_amount, current_amount, due_date, icon, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          dbId(userId, goal.id),
          userId,
          goal.name,
          goal.targetAmount,
          goal.currentAmount,
          goal.dueDate ?? null,
          goal.icon,
          goal.createdAt,
          goal.updatedAt
        ]
      )
    }

    for (const subscription of subscriptions) {
      await client.query(
        'insert into subscriptions (id, user_id, name, amount, renewal_date, recurrence, notify_before_days, category_id, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          dbId(userId, subscription.id),
          userId,
          subscription.name,
          subscription.amount,
          subscription.renewalDate,
          subscription.recurrence,
          subscription.notifyBeforeDays,
          dbId(userId, subscription.categoryId),
          subscription.createdAt,
          subscription.updatedAt
        ]
      )
    }

    for (const debt of debts) {
      await client.query(
        'insert into debts (id, user_id, person, amount, direction, due_date, history, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)',
        [
          dbId(userId, debt.id),
          userId,
          debt.person,
          debt.amount,
          debt.direction,
          debt.dueDate ?? null,
          JSON.stringify(debt.history),
          debt.createdAt,
          debt.updatedAt
        ]
      )
    }

    if (settings) {
      await client.query(
        'insert into settings (id, user_id, data, updated_at) values ($1, $2, $3::jsonb, now())',
        [userId, userId, JSON.stringify(settings)]
      )
    }

    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  }
}

export const handler: Handler = async (event) => {
  try {
    const user = await requireUser(event)

    if (event.httpMethod === 'GET') {
      return json(200, { ok: true, snapshot: await pullSnapshot(user.id) })
    }

    if (event.httpMethod === 'PUT') {
      const snapshot = JSON.parse(event.body ?? 'null') as unknown
      if (!isSnapshot(snapshot))
        return json(400, { ok: false, message: 'Invalid snapshot payload.' })

      const client = await getReadWritePool().connect()
      try {
        await replaceRemoteData(client, snapshot, user.id)
      } finally {
        client.release()
      }

      return json(200, { ok: true, savedAt: new Date().toISOString() })
    }

    return json(405, { ok: false, message: 'Method not allowed.' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return json(401, { ok: false, message: 'Non authentifié.' })
    }
    console.error('Unable to sync application data', error)
    return json(500, { ok: false, message: 'Unable to sync application data.' })
  }
}
