import type { Handler } from '@netlify/functions'
import type { PoolClient } from 'pg'

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

const pullSnapshot = async (): Promise<AppSnapshot | null> => {
  const pool = getReadOnlyPool()
  const [accounts, categories, budgets, transactions, goals, subscriptions, debts, settings] =
    await Promise.all([
      pool.query('select id, name, type, balance from accounts order by created_at, id'),
      pool.query(
        'select id, name, icon, color, parent_id, budget_id from categories order by created_at, id'
      ),
      pool.query(
        'select id, name, amount, period, category_id, alert_threshold, created_at, updated_at from budgets order by created_at, id'
      ),
      pool.query(
        'select id, kind, title, description, amount, date, time, category_id, sub_category_id, account_id, payment_method, tags, receipt_photo, location, recurrence, archived, created_at, updated_at from transactions order by date desc, time desc, created_at desc'
      ),
      pool.query(
        'select id, name, target_amount, current_amount, due_date, icon, created_at, updated_at from goals order by created_at, id'
      ),
      pool.query(
        'select id, name, amount, renewal_date, recurrence, notify_before_days, category_id, created_at, updated_at from subscriptions order by renewal_date, id'
      ),
      pool.query(
        'select id, person, amount, direction, due_date, history, created_at, updated_at from debts order by created_at, id'
      ),
      pool.query("select data from settings where id = 'default'")
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
      id: row.id,
      kind: row.kind,
      title: row.title,
      description: row.description ?? '',
      amount: numberValue(row.amount),
      date: dateOnly(row.date) ?? new Date().toISOString().slice(0, 10),
      time: timeOnly(row.time),
      categoryId: row.category_id ?? '',
      subCategoryId: row.sub_category_id ?? undefined,
      accountId: row.account_id ?? '',
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
          id: row.id,
          name: row.name,
          type: row.type,
          balance: numberValue(row.balance)
        })
      )
    },
    categories: {
      categories: categories.rows.map(
        (row): Category => ({
          id: row.id,
          name: row.name,
          icon: row.icon,
          color: row.color,
          parentId: row.parent_id ?? undefined,
          budgetId: row.budget_id ?? undefined
        })
      )
    },
    budgets: {
      budgets: budgets.rows.map(
        (row): Budget => ({
          id: row.id,
          name: row.name,
          amount: numberValue(row.amount),
          period: row.period,
          categoryId: row.category_id ?? undefined,
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
          id: row.id,
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
          id: row.id,
          name: row.name,
          amount: numberValue(row.amount),
          renewalDate: dateOnly(row.renewal_date) ?? new Date().toISOString().slice(0, 10),
          recurrence: row.recurrence,
          notifyBeforeDays: Number(row.notify_before_days),
          categoryId: row.category_id ?? undefined,
          createdAt: row.created_at?.toISOString?.() ?? String(row.created_at),
          updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at)
        })
      )
    },
    debts: {
      debts: debts.rows.map(
        (row): Debt => ({
          id: row.id,
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

const replaceRemoteData = async (client: PoolClient, snapshot: AppSnapshot) => {
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
    await client.query(`
      delete from transactions;
      delete from budgets;
      delete from subscriptions;
      delete from debts;
      delete from goals;
      delete from categories;
      delete from accounts;
      delete from settings;
    `)

    await client.query(`
      insert into app_users (display_name)
      select 'Utilisateur local'
      where not exists (select 1 from app_users)
    `)

    for (const account of accounts) {
      await client.query('insert into accounts (id, name, type, balance) values ($1, $2, $3, $4)', [
        account.id,
        account.name,
        account.type,
        account.balance
      ])
    }

    for (const category of categories) {
      await client.query('insert into categories (id, name, icon, color) values ($1, $2, $3, $4)', [
        category.id,
        category.name,
        category.icon,
        category.color
      ])
    }

    for (const category of categories) {
      await client.query('update categories set parent_id = $2, budget_id = $3 where id = $1', [
        category.id,
        category.parentId ?? null,
        category.budgetId ?? null
      ])
    }

    for (const budget of budgets) {
      await client.query(
        'insert into budgets (id, name, amount, period, category_id, alert_threshold, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          budget.id,
          budget.name,
          budget.amount,
          budget.period,
          budget.categoryId ?? null,
          budget.alertThreshold,
          budget.createdAt,
          budget.updatedAt
        ]
      )
    }

    for (const transaction of [...expenses, ...income]) {
      await client.query(
        'insert into transactions (id, kind, title, description, amount, date, time, category_id, sub_category_id, account_id, payment_method, tags, receipt_photo, location, recurrence, archived, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)',
        [
          transaction.id,
          transaction.kind,
          transaction.title,
          transaction.description,
          transaction.amount,
          transaction.date,
          transaction.time,
          transaction.categoryId || null,
          transaction.subCategoryId ?? null,
          transaction.accountId || null,
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
        'insert into goals (id, name, target_amount, current_amount, due_date, icon, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          goal.id,
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
        'insert into subscriptions (id, name, amount, renewal_date, recurrence, notify_before_days, category_id, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          subscription.id,
          subscription.name,
          subscription.amount,
          subscription.renewalDate,
          subscription.recurrence,
          subscription.notifyBeforeDays,
          subscription.categoryId ?? null,
          subscription.createdAt,
          subscription.updatedAt
        ]
      )
    }

    for (const debt of debts) {
      await client.query(
        'insert into debts (id, person, amount, direction, due_date, history, created_at, updated_at) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)',
        [
          debt.id,
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
        "insert into settings (id, data, updated_at) values ('default', $1::jsonb, now())",
        [JSON.stringify(settings)]
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
    if (event.httpMethod === 'GET') {
      return json(200, { ok: true, snapshot: await pullSnapshot() })
    }

    if (event.httpMethod === 'PUT') {
      const snapshot = JSON.parse(event.body ?? 'null') as unknown
      if (!isSnapshot(snapshot))
        return json(400, { ok: false, message: 'Invalid snapshot payload.' })

      const client = await getReadWritePool().connect()
      try {
        await replaceRemoteData(client, snapshot)
      } finally {
        client.release()
      }

      return json(200, { ok: true, savedAt: new Date().toISOString() })
    }

    return json(405, { ok: false, message: 'Method not allowed.' })
  } catch {
    return json(500, { ok: false, message: 'Unable to sync application data.' })
  }
}
