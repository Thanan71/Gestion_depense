export type ThemeMode = 'light' | 'dark' | 'auto'
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'
export type TransactionKind = 'expense' | 'income'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type DebtDirection = 'owed_by_me' | 'owed_to_me'
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  parentId?: string
  budgetId?: string
}

export interface Account {
  id: string
  name: string
  type: 'cash' | 'bank' | 'savings' | 'paypal' | 'crypto'
  balance: number
}

export interface TransactionBase {
  id: string
  title: string
  description: string
  amount: number
  date: string
  time: string
  categoryId: string
  subCategoryId?: string
  accountId: string
  paymentMethod: string
  tags: string[]
  receiptPhoto?: string
  location?: string
  recurrence: Recurrence
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface Expense extends TransactionBase {
  kind: 'expense'
}

export interface Income extends TransactionBase {
  kind: 'income'
}

export interface Budget {
  id: string
  name: string
  amount: number
  period: BudgetPeriod
  categoryId?: string
  alertThreshold: number
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  dueDate?: string
  icon: string
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  renewalDate: string
  recurrence: Exclude<Recurrence, 'none' | 'daily'>
  notifyBeforeDays: number
  categoryId?: string
  createdAt: string
  updatedAt: string
}

export interface Debt {
  id: string
  person: string
  amount: number
  direction: DebtDirection
  dueDate?: string
  history: Array<{ date: string; amount: number; note: string }>
  createdAt: string
  updatedAt: string
}

export interface Settings {
  currency: 'EUR' | 'USD' | 'GBP'
  locale: 'fr-FR' | 'en-US'
  theme: ThemeMode
  dateFormat: string
  weekStartsOn: 0 | 1
  notifications: {
    budgetExceeded: boolean
    newExpense: boolean
    goalReached: boolean
    subscriptionTomorrow: boolean
  }
  dashboardWidgets: string[]
}

export interface DashboardAlert {
  id: string
  level: 'info' | 'warning' | 'success'
  message: string
}

export interface SearchResult {
  id: string
  title: string
  description: string
  type: 'expense' | 'income' | 'budget' | 'goal' | 'subscription' | 'debt'
  amount?: number
  date?: string
  href: string
}
