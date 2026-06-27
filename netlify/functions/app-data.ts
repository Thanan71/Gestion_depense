import { randomUUID } from 'node:crypto'
import type { Handler } from '@netlify/functions'
import type { PoolClient } from 'pg'

import { requireUser, safeJsonParse } from '../../src/server/auth.js'
import { getReadWritePool } from '../../src/server/database.js'
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
import { validateSnapshotForSync } from '../../src/utils/snapshotValidation.js'

type Transaction = Expense | Income
type DataTable =
  | 'accounts'
  | 'categories'
  | 'budgets'
  | 'transactions'
  | 'goals'
  | 'subscriptions'
  | 'debts'

const DATA_TABLES: DataTable[] = [
  'accounts',
  'categories',
  'budgets',
  'transactions',
  'goals',
  'subscriptions',
  'debts'
]
const MAX_BACKUPS_PER_USER = 20
const MASS_DELETE_MIN_ROWS = 10
const MASS_DELETE_RATIO = 0.2

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
})

const isSnapshot = (value: unknown): value is AppSnapshot => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppSnapshot>
  return (
    typeof candidate.version === 'number' &&
    Boolean(candidate.stores) &&
    typeof candidate.stores === 'object'
  )
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
const timestamp = (value?: string) => value || new Date().toISOString()

const dbIdIfKnown = (userId: string, id: string | undefined, knownIds: Set<string>) =>
  id && knownIds.has(id) ? dbId(userId, id) : null

let appDataSchemaReady: Promise<void> | undefined

const ensureAppDataSchema = () => {
  appDataSchemaReady ??= getReadWritePool()
    .query(`
      create extension if not exists pgcrypto;

      create table if not exists app_data_revisions (
        user_id uuid primary key references app_users(id) on delete cascade,
        revision_id text not null,
        updated_at timestamptz not null default now()
      );

      create table if not exists app_data_backups (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references app_users(id) on delete cascade,
        revision_id text,
        snapshot jsonb not null,
        created_at timestamptz not null default now()
      );

      create index if not exists app_data_backups_user_created_idx
        on app_data_backups(user_id, created_at desc);
    `)
    .then(() => undefined)

  return appDataSchemaReady
}

const getRevision = async (client: PoolClient, userId: string) => {
  const { rows } = await client.query<{ revision_id: string }>(
    'select revision_id from app_data_revisions where user_id = $1',
    [userId]
  )
  return rows[0]?.revision_id ?? null
}

const setRevision = async (client: PoolClient, userId: string, revisionId: string) => {
  await client.query(
    `
      insert into app_data_revisions (user_id, revision_id, updated_at)
      values ($1, $2, now())
      on conflict (user_id)
      do update set revision_id = excluded.revision_id, updated_at = now()
    `,
    [userId, revisionId]
  )
}

const deleteMissing = async (
  client: PoolClient,
  table: string,
  userId: string,
  ids: Array<string | null>
) => {
  await client.query(`delete from ${table} where user_id = $1 and not (id = any($2::text[]))`, [
    userId,
    ids.filter(Boolean)
  ])
}

const backupCurrentRemoteData = async (
  client: PoolClient,
  userId: string,
  revisionId: string | null
) => {
  await client.query(
    `
      insert into app_data_backups (user_id, revision_id, snapshot)
      select
        $1,
        $2,
        jsonb_build_object(
          'accounts', coalesce((select jsonb_agg(to_jsonb(accounts)) from accounts where user_id = $1), '[]'::jsonb),
          'categories', coalesce((select jsonb_agg(to_jsonb(categories)) from categories where user_id = $1), '[]'::jsonb),
          'budgets', coalesce((select jsonb_agg(to_jsonb(budgets)) from budgets where user_id = $1), '[]'::jsonb),
          'transactions', coalesce((select jsonb_agg(to_jsonb(transactions)) from transactions where user_id = $1), '[]'::jsonb),
          'goals', coalesce((select jsonb_agg(to_jsonb(goals)) from goals where user_id = $1), '[]'::jsonb),
          'subscriptions', coalesce((select jsonb_agg(to_jsonb(subscriptions)) from subscriptions where user_id = $1), '[]'::jsonb),
          'debts', coalesce((select jsonb_agg(to_jsonb(debts)) from debts where user_id = $1), '[]'::jsonb),
          'settings', coalesce((select jsonb_agg(to_jsonb(settings)) from settings where user_id = $1), '[]'::jsonb)
        )
      where exists (select 1 from accounts where user_id = $1)
        or exists (select 1 from categories where user_id = $1)
        or exists (select 1 from budgets where user_id = $1)
        or exists (select 1 from transactions where user_id = $1)
        or exists (select 1 from goals where user_id = $1)
        or exists (select 1 from subscriptions where user_id = $1)
        or exists (select 1 from debts where user_id = $1)
        or exists (select 1 from settings where user_id = $1)
    `,
    [userId, revisionId]
  )
}

const purgeOldBackups = async (client: PoolClient, userId: string) => {
  await client.query(
    `
      delete from app_data_backups
      where user_id = $1
        and id in (
          select id
          from (
            select
              id,
              row_number() over (order by created_at desc, id desc) as backup_rank
            from app_data_backups
            where user_id = $1
          ) ranked_backups
          where backup_rank > $2
        )
    `,
    [userId, MAX_BACKUPS_PER_USER]
  )
}

const countRemoteData = async (client: PoolClient, userId: string) => {
  const counts = Object.fromEntries(DATA_TABLES.map((table) => [table, 0])) as Record<
    DataTable,
    number
  >

  for (const table of DATA_TABLES) {
    const { rows } = await client.query<{ count: string }>(
      `select count(*)::int as count from ${table} where user_id = $1`,
      [userId]
    )
    counts[table] = Number(rows[0]?.count ?? 0)
  }

  return counts
}

const detectSuspiciousDeletion = (
  currentCounts: Record<DataTable, number>,
  incomingCounts: Record<DataTable, number>
) => {
  const currentTotal = DATA_TABLES.reduce((sum, table) => sum + currentCounts[table], 0)
  const incomingTotal = DATA_TABLES.reduce((sum, table) => sum + incomingCounts[table], 0)

  if (currentTotal >= MASS_DELETE_MIN_ROWS && incomingTotal < currentTotal * MASS_DELETE_RATIO) {
    return true
  }

  return DATA_TABLES.some(
    (table) =>
      currentCounts[table] >= MASS_DELETE_MIN_ROWS &&
      incomingCounts[table] < currentCounts[table] * MASS_DELETE_RATIO
  )
}

const pullSnapshot = async (userId: string): Promise<AppSnapshot | null> => {
  const pool = getReadWritePool()
  const [
    accounts,
    categories,
    budgets,
    transactions,
    goals,
    subscriptions,
    debts,
    settings,
    revision
  ] = await Promise.all([
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
    pool.query('select data from settings where user_id = $1', [userId]),
    pool.query<{ revision_id: string }>(
      'select revision_id from app_data_revisions where user_id = $1',
      [userId]
    )
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
    revisionId: revision.rows[0]?.revision_id ?? null,
    stores
  }
}

const saveRemoteData = async (client: PoolClient, snapshot: AppSnapshot, userId: string) => {
  const accounts = (snapshot.stores.accounts?.accounts ?? []) as Account[]
  const categories = (snapshot.stores.categories?.categories ?? []) as Category[]
  const budgets = (snapshot.stores.budgets?.budgets ?? []) as Budget[]
  const expenses = (snapshot.stores.expenses?.expenses ?? []) as Expense[]
  const income = (snapshot.stores.income?.income ?? []) as Income[]
  const goals = (snapshot.stores.goals?.goals ?? []) as Goal[]
  const subscriptions = (snapshot.stores.subscriptions?.subscriptions ?? []) as Subscription[]
  const debts = (snapshot.stores.debts?.debts ?? []) as Debt[]
  const settings = snapshot.stores.settings?.settings as Settings | undefined
  const categoryIds = new Set(categories.map((category) => category.id))
  const accountIds = new Set(accounts.map((account) => account.id))
  const incomingCounts: Record<DataTable, number> = {
    accounts: accounts.length,
    categories: categories.length,
    budgets: budgets.length,
    transactions: expenses.length + income.length,
    goals: goals.length,
    subscriptions: subscriptions.length,
    debts: debts.length
  }

  await client.query('begin')
  try {
    await client.query('select pg_advisory_xact_lock(hashtext($1))', [userId])

    const currentRevisionId = await getRevision(client, userId)
    if ((snapshot.baseRevisionId ?? null) !== currentRevisionId) {
      await client.query('rollback')
      return {
        ok: false,
        statusCode: 409,
        revisionId: currentRevisionId,
        message:
          'Les données distantes ont changé. Recharge la synchronisation avant de sauvegarder.'
      }
    }

    const currentCounts = await countRemoteData(client, userId)
    if (!snapshot.allowDestructiveSync && detectSuspiciousDeletion(currentCounts, incomingCounts)) {
      await client.query('rollback')
      return {
        ok: false,
        statusCode: 409,
        revisionId: currentRevisionId,
        message:
          'Synchronisation refusée : le navigateur essaie de supprimer une grande partie des données distantes.'
      }
    }

    await backupCurrentRemoteData(client, userId, currentRevisionId)
    await purgeOldBackups(client, userId)

    for (const account of accounts) {
      await client.query(
        `
          insert into accounts (id, user_id, name, type, balance, updated_at)
          values ($1, $2, $3, $4, $5, now())
          on conflict (id)
          do update set
            name = excluded.name,
            type = excluded.type,
            balance = excluded.balance,
            updated_at = now()
        `,
        [dbId(userId, account.id), userId, account.name, account.type, account.balance]
      )
    }

    for (const category of categories) {
      await client.query(
        `
          insert into categories (id, user_id, name, icon, color, updated_at)
          values ($1, $2, $3, $4, $5, now())
          on conflict (id)
          do update set
            name = excluded.name,
            icon = excluded.icon,
            color = excluded.color,
            updated_at = now()
        `,
        [dbId(userId, category.id), userId, category.name, category.icon, category.color]
      )
    }

    for (const category of categories) {
      await client.query(
        'update categories set parent_id = $3, budget_id = $4, updated_at = now() where id = $1 and user_id = $2',
        [
          dbId(userId, category.id),
          userId,
          dbIdIfKnown(userId, category.parentId, categoryIds),
          dbId(userId, category.budgetId)
        ]
      )
    }

    for (const budget of budgets) {
      await client.query(
        `
          insert into budgets (
            id, user_id, name, amount, period, category_id, alert_threshold, created_at, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          on conflict (id)
          do update set
            name = excluded.name,
            amount = excluded.amount,
            period = excluded.period,
            category_id = excluded.category_id,
            alert_threshold = excluded.alert_threshold,
            updated_at = excluded.updated_at
        `,
        [
          dbId(userId, budget.id),
          userId,
          budget.name,
          budget.amount,
          budget.period,
          dbIdIfKnown(userId, budget.categoryId, categoryIds),
          budget.alertThreshold,
          timestamp(budget.createdAt),
          timestamp(budget.updatedAt)
        ]
      )
    }

    for (const transaction of [...expenses, ...income]) {
      await client.query(
        `
          insert into transactions (
            id, user_id, kind, title, description, amount, date, time, category_id,
            sub_category_id, account_id, payment_method, tags, receipt_photo, location,
            recurrence, archived, created_at, updated_at
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19
          )
          on conflict (id)
          do update set
            kind = excluded.kind,
            title = excluded.title,
            description = excluded.description,
            amount = excluded.amount,
            date = excluded.date,
            time = excluded.time,
            category_id = excluded.category_id,
            sub_category_id = excluded.sub_category_id,
            account_id = excluded.account_id,
            payment_method = excluded.payment_method,
            tags = excluded.tags,
            receipt_photo = excluded.receipt_photo,
            location = excluded.location,
            recurrence = excluded.recurrence,
            archived = excluded.archived,
            updated_at = excluded.updated_at
        `,
        [
          dbId(userId, transaction.id),
          userId,
          transaction.kind,
          transaction.title,
          transaction.description ?? '',
          transaction.amount,
          transaction.date,
          transaction.time,
          dbIdIfKnown(userId, transaction.categoryId, categoryIds),
          dbIdIfKnown(userId, transaction.subCategoryId, categoryIds),
          dbIdIfKnown(userId, transaction.accountId, accountIds),
          transaction.paymentMethod,
          transaction.tags,
          transaction.receiptPhoto ?? null,
          transaction.location ?? null,
          transaction.recurrence,
          transaction.archived,
          timestamp(transaction.createdAt),
          timestamp(transaction.updatedAt)
        ]
      )
    }

    for (const goal of goals) {
      await client.query(
        `
          insert into goals (
            id, user_id, name, target_amount, current_amount, due_date, icon, created_at, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          on conflict (id)
          do update set
            name = excluded.name,
            target_amount = excluded.target_amount,
            current_amount = excluded.current_amount,
            due_date = excluded.due_date,
            icon = excluded.icon,
            updated_at = excluded.updated_at
        `,
        [
          dbId(userId, goal.id),
          userId,
          goal.name,
          goal.targetAmount,
          goal.currentAmount,
          goal.dueDate ?? null,
          goal.icon,
          timestamp(goal.createdAt),
          timestamp(goal.updatedAt)
        ]
      )
    }

    for (const subscription of subscriptions) {
      await client.query(
        `
          insert into subscriptions (
            id, user_id, name, amount, renewal_date, recurrence, notify_before_days,
            category_id, created_at, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          on conflict (id)
          do update set
            name = excluded.name,
            amount = excluded.amount,
            renewal_date = excluded.renewal_date,
            recurrence = excluded.recurrence,
            notify_before_days = excluded.notify_before_days,
            category_id = excluded.category_id,
            updated_at = excluded.updated_at
        `,
        [
          dbId(userId, subscription.id),
          userId,
          subscription.name,
          subscription.amount,
          subscription.renewalDate,
          subscription.recurrence,
          subscription.notifyBeforeDays,
          dbIdIfKnown(userId, subscription.categoryId, categoryIds),
          timestamp(subscription.createdAt),
          timestamp(subscription.updatedAt)
        ]
      )
    }

    for (const debt of debts) {
      await client.query(
        `
          insert into debts (
            id, user_id, person, amount, direction, due_date, history, created_at, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
          on conflict (id)
          do update set
            person = excluded.person,
            amount = excluded.amount,
            direction = excluded.direction,
            due_date = excluded.due_date,
            history = excluded.history,
            updated_at = excluded.updated_at
        `,
        [
          dbId(userId, debt.id),
          userId,
          debt.person,
          debt.amount,
          debt.direction,
          debt.dueDate ?? null,
          JSON.stringify(debt.history),
          timestamp(debt.createdAt),
          timestamp(debt.updatedAt)
        ]
      )
    }

    if (settings) {
      await client.query(
        `
          insert into settings (id, user_id, data, updated_at)
          values ($1, $2, $3::jsonb, now())
          on conflict (id)
          do update set data = excluded.data, updated_at = now()
        `,
        [userId, userId, JSON.stringify(settings)]
      )
    } else {
      await client.query('delete from settings where user_id = $1', [userId])
    }

    await deleteMissing(
      client,
      'transactions',
      userId,
      [...expenses, ...income].map((transaction) => dbId(userId, transaction.id))
    )
    await deleteMissing(
      client,
      'subscriptions',
      userId,
      subscriptions.map((subscription) => dbId(userId, subscription.id))
    )
    await deleteMissing(
      client,
      'budgets',
      userId,
      budgets.map((budget) => dbId(userId, budget.id))
    )
    await deleteMissing(
      client,
      'debts',
      userId,
      debts.map((debt) => dbId(userId, debt.id))
    )
    await deleteMissing(
      client,
      'goals',
      userId,
      goals.map((goal) => dbId(userId, goal.id))
    )
    await deleteMissing(
      client,
      'categories',
      userId,
      categories.map((category) => dbId(userId, category.id))
    )
    await deleteMissing(
      client,
      'accounts',
      userId,
      accounts.map((account) => dbId(userId, account.id))
    )

    const revisionId = randomUUID()
    await setRevision(client, userId, revisionId)
    await client.query('commit')
    return { ok: true, revisionId }
  } catch (error) {
    await client.query('rollback')
    throw error
  }
}

export const handler: Handler = async (event) => {
  try {
    const user = await requireUser(event)
    await ensureAppDataSchema()

    if (event.httpMethod === 'GET') {
      return json(200, { ok: true, snapshot: await pullSnapshot(user.id) })
    }

    if (event.httpMethod === 'PUT') {
      const snapshot = safeJsonParse<AppSnapshot>(event.body)
      if (!isSnapshot(snapshot))
        return json(400, { ok: false, message: 'Invalid snapshot payload.' })
      const validation = validateSnapshotForSync(snapshot)
      if (!validation.valid) return json(400, { ok: false, message: validation.message })

      const client = await getReadWritePool().connect()
      let result: Awaited<ReturnType<typeof saveRemoteData>>
      try {
        result = await saveRemoteData(client, snapshot, user.id)
      } finally {
        client.release()
      }

      if (!result.ok) {
        return json(result.statusCode, {
          ok: false,
          message: result.message,
          revisionId: result.revisionId
        })
      }

      return json(200, {
        ok: true,
        savedAt: new Date().toISOString(),
        revisionId: result.revisionId
      })
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
