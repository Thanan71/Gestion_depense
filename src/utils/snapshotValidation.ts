import type { AppSnapshot } from '@/types/sync'

type ValidationResult = { valid: true } | { valid: false; message: string }

const COLLECTION_LIMITS = {
  accounts: 200,
  categories: 500,
  budgets: 500,
  expenses: 10_000,
  income: 10_000,
  goals: 1_000,
  subscriptions: 1_000,
  debts: 1_000
} as const

const MAX_TEXT_LENGTH = 500
const MAX_ID_LENGTH = 180
const MAX_MONEY = 999_999_999

const accountTypes = new Set(['cash', 'bank', 'savings', 'paypal', 'crypto'])
const budgetPeriods = new Set(['weekly', 'monthly', 'yearly'])
const recurrences = new Set(['none', 'daily', 'weekly', 'monthly', 'yearly'])
const subscriptionRecurrences = new Set(['weekly', 'monthly', 'yearly'])
const debtDirections = new Set(['owed_by_me', 'owed_to_me'])

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isString = (value: unknown, max = MAX_TEXT_LENGTH): value is string =>
  typeof value === 'string' && value.length <= max

const isOptionalString = (value: unknown, max = MAX_TEXT_LENGTH) =>
  value === undefined || value === null || isString(value, max)

const isId = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_ID_LENGTH

const isOptionalId = (value: unknown) =>
  value === undefined || value === null || value === '' || isId(value)

const isFiniteMoney = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_MONEY

const isIntegerInRange = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) && Number(value) >= min && Number(value) <= max

const isDateLike = (value: unknown) => {
  if (!isString(value, 40)) return false
  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
}

const isDateOnly = (value: unknown) =>
  isString(value, 10) && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))

const isTimeOnly = (value: unknown) => isString(value, 5) && /^\d{2}:\d{2}$/.test(value)

const validCollection = (
  name: keyof typeof COLLECTION_LIMITS,
  value: unknown,
  validateItem: (item: Record<string, unknown>) => boolean
): ValidationResult => {
  if (value === undefined) return { valid: true }
  if (!Array.isArray(value)) return { valid: false, message: `${name} doit être une liste.` }
  if (value.length > COLLECTION_LIMITS[name]) {
    return { valid: false, message: `${name} contient trop d'éléments.` }
  }

  const ids = new Set<string>()
  for (const item of value) {
    if (!isPlainObject(item) || !validateItem(item)) {
      return { valid: false, message: `${name} contient des données invalides.` }
    }
    const id = String(item.id)
    if (ids.has(id)) return { valid: false, message: `${name} contient des doublons.` }
    ids.add(id)
  }

  return { valid: true }
}

const validateAccount = (account: Record<string, unknown>) =>
  isId(account.id) &&
  isString(account.name, 120) &&
  accountTypes.has(String(account.type)) &&
  isFiniteMoney(account.balance)

const validateCategory = (category: Record<string, unknown>) =>
  isId(category.id) &&
  isString(category.name, 120) &&
  isString(category.icon, 80) &&
  isString(category.color, 40) &&
  isOptionalId(category.parentId) &&
  isOptionalId(category.budgetId)

const validateBudget = (budget: Record<string, unknown>) =>
  isId(budget.id) &&
  isString(budget.name, 120) &&
  isFiniteMoney(budget.amount) &&
  budgetPeriods.has(String(budget.period)) &&
  isOptionalId(budget.categoryId) &&
  isIntegerInRange(budget.alertThreshold, 1, 100) &&
  isDateLike(budget.createdAt) &&
  isDateLike(budget.updatedAt)

const validateTransaction = (transaction: Record<string, unknown>, kind: 'expense' | 'income') =>
  isId(transaction.id) &&
  transaction.kind === kind &&
  isString(transaction.title, 160) &&
  isString(transaction.description ?? '', MAX_TEXT_LENGTH) &&
  isFiniteMoney(transaction.amount) &&
  isDateOnly(transaction.date) &&
  isTimeOnly(transaction.time) &&
  isOptionalId(transaction.categoryId) &&
  isOptionalId(transaction.subCategoryId) &&
  isOptionalId(transaction.accountId) &&
  isString(transaction.paymentMethod, 80) &&
  Array.isArray(transaction.tags) &&
  transaction.tags.length <= 50 &&
  transaction.tags.every((tag) => isString(tag, 60)) &&
  isOptionalString(transaction.receiptPhoto, 20_000) &&
  isOptionalString(transaction.location, 180) &&
  recurrences.has(String(transaction.recurrence)) &&
  typeof transaction.archived === 'boolean' &&
  isDateLike(transaction.createdAt) &&
  isDateLike(transaction.updatedAt)

const validateGoal = (goal: Record<string, unknown>) =>
  isId(goal.id) &&
  isString(goal.name, 120) &&
  isFiniteMoney(goal.targetAmount) &&
  isFiniteMoney(goal.currentAmount) &&
  (goal.dueDate === undefined || goal.dueDate === null || isDateOnly(goal.dueDate)) &&
  isString(goal.icon, 80) &&
  isDateLike(goal.createdAt) &&
  isDateLike(goal.updatedAt)

const validateSubscription = (subscription: Record<string, unknown>) =>
  isId(subscription.id) &&
  isString(subscription.name, 120) &&
  isFiniteMoney(subscription.amount) &&
  isDateOnly(subscription.renewalDate) &&
  subscriptionRecurrences.has(String(subscription.recurrence)) &&
  isIntegerInRange(subscription.notifyBeforeDays, 0, 365) &&
  isOptionalId(subscription.categoryId) &&
  isDateLike(subscription.createdAt) &&
  isDateLike(subscription.updatedAt)

const validateDebt = (debt: Record<string, unknown>) =>
  isId(debt.id) &&
  isString(debt.person, 120) &&
  isFiniteMoney(debt.amount) &&
  debtDirections.has(String(debt.direction)) &&
  (debt.dueDate === undefined || debt.dueDate === null || isDateOnly(debt.dueDate)) &&
  Array.isArray(debt.history) &&
  debt.history.length <= 1_000 &&
  debt.history.every(
    (item) =>
      isPlainObject(item) &&
      isDateOnly(item.date) &&
      isFiniteMoney(item.amount) &&
      isString(item.note, 180)
  ) &&
  isDateLike(debt.createdAt) &&
  isDateLike(debt.updatedAt)

const validateSettings = (settings: unknown): ValidationResult => {
  if (settings === undefined) return { valid: true }
  if (!isPlainObject(settings)) return { valid: false, message: 'Paramètres invalides.' }
  if (!['EUR', 'USD', 'GBP'].includes(String(settings.currency))) {
    return { valid: false, message: 'Devise invalide.' }
  }
  if (!['fr-FR', 'en-US'].includes(String(settings.locale))) {
    return { valid: false, message: 'Langue invalide.' }
  }
  if (!['light', 'dark', 'auto'].includes(String(settings.theme))) {
    return { valid: false, message: 'Thème invalide.' }
  }
  if (!isString(settings.dateFormat, 40) || ![0, 1].includes(Number(settings.weekStartsOn))) {
    return { valid: false, message: 'Format de paramètres invalide.' }
  }
  if (!isPlainObject(settings.notifications) || !Array.isArray(settings.dashboardWidgets)) {
    return { valid: false, message: 'Préférences invalides.' }
  }
  if (!Object.values(settings.notifications).every((value) => typeof value === 'boolean')) {
    return { valid: false, message: 'Notifications invalides.' }
  }
  if (
    settings.dashboardWidgets.length > 30 ||
    !settings.dashboardWidgets.every((widget) => isString(widget, 60))
  ) {
    return { valid: false, message: 'Widgets invalides.' }
  }
  return { valid: true }
}

export const validateSnapshotForSync = (snapshot: AppSnapshot): ValidationResult => {
  if (snapshot.version !== 2) return { valid: false, message: 'Version de sauvegarde invalide.' }
  if (!isDateLike(snapshot.exportedAt))
    return { valid: false, message: 'Date de sauvegarde invalide.' }
  if (!isPlainObject(snapshot.stores)) return { valid: false, message: 'Sauvegarde invalide.' }

  const checks = [
    validCollection('accounts', snapshot.stores.accounts?.accounts, validateAccount),
    validCollection('categories', snapshot.stores.categories?.categories, validateCategory),
    validCollection('budgets', snapshot.stores.budgets?.budgets, validateBudget),
    validCollection('expenses', snapshot.stores.expenses?.expenses, (item) =>
      validateTransaction(item, 'expense')
    ),
    validCollection('income', snapshot.stores.income?.income, (item) =>
      validateTransaction(item, 'income')
    ),
    validCollection('goals', snapshot.stores.goals?.goals, validateGoal),
    validCollection(
      'subscriptions',
      snapshot.stores.subscriptions?.subscriptions,
      validateSubscription
    ),
    validCollection('debts', snapshot.stores.debts?.debts, validateDebt),
    validateSettings(snapshot.stores.settings?.settings)
  ]

  return checks.find((check) => !check.valid) ?? { valid: true }
}
