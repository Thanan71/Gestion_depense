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
} from '@/types/finance'

const now = new Date().toISOString()
const month = new Date().toISOString().slice(0, 7)
const AUTH_USER_ID_STORAGE_KEY = 'gestion-depense:auth-user-id'

const isAuthenticatedStorageReady = () =>
  typeof window !== 'undefined' && Boolean(window.localStorage.getItem(AUTH_USER_ID_STORAGE_KEY))

const cloneItems = <T>(items: T[]): T[] => JSON.parse(JSON.stringify(items)) as T[]

export const demoDataEnabled = () =>
  import.meta.env.VITE_ENABLE_DEMO_DATA === 'true' && !isAuthenticatedStorageReady()

export const initialDemoItems = <T>(items: T[]): T[] => (demoDataEnabled() ? cloneItems(items) : [])

export const initialDefaultItems = <T>(items: T[]): T[] => cloneItems(items)

export const PAYMENT_METHODS = [
  'CB',
  'Visa',
  'Mastercard',
  'Espèces',
  'Virement',
  'Apple Pay',
  'Google Pay',
  'Paypal',
  'Crypto'
] as const

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'Espèces', type: 'cash', balance: 0 },
  { id: 'current', name: 'Compte courant', type: 'bank', balance: 0 },
  { id: 'savings', name: 'Livret', type: 'savings', balance: 0 },
  { id: 'paypal', name: 'Paypal', type: 'paypal', balance: 0 },
  { id: 'crypto', name: 'Crypto', type: 'crypto', balance: 0 }
]

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentation', icon: 'Utensils', color: '#0f766e' },
  { id: 'restaurant', name: 'Restaurant', icon: 'ChefHat', color: '#14b8a6', parentId: 'food' },
  { id: 'groceries', name: 'Courses', icon: 'ShoppingBasket', color: '#2dd4bf', parentId: 'food' },
  { id: 'transport', name: 'Transport', icon: 'Train', color: '#2563eb' },
  { id: 'fuel', name: 'Essence', icon: 'Fuel', color: '#60a5fa', parentId: 'transport' },
  { id: 'home', name: 'Maison', icon: 'Home', color: '#7c3aed' },
  { id: 'utilities', name: 'Electricité', icon: 'Zap', color: '#a78bfa', parentId: 'home' },
  { id: 'leisure', name: 'Loisirs', icon: 'Gamepad2', color: '#db2777' },
  { id: 'travel', name: 'Voyage', icon: 'Plane', color: '#f97316' },
  { id: 'health', name: 'Santé', icon: 'HeartPulse', color: '#dc2626' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ca8a04' },
  { id: 'misc', name: 'Divers', icon: 'Boxes', color: '#475569' },
  { id: 'salary', name: 'Salaire', icon: 'BriefcaseBusiness', color: '#16a34a' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop', color: '#059669' },
  { id: 'gift', name: 'Cadeau', icon: 'Gift', color: '#c026d3' },
  { id: 'investment', name: 'Investissement', icon: 'TrendingUp', color: '#0891b2' }
]

export const DEFAULT_SETTINGS: Settings = {
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
  dashboardWidgets: [
    'balance',
    'income',
    'expenses',
    'budget',
    'chart',
    'recent',
    'goals',
    'alerts',
    'subscriptions'
  ]
}

export const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'monthly-main',
    name: 'Budget mensuel',
    amount: 1800,
    period: 'monthly',
    alertThreshold: 80,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'food-budget',
    name: 'Alimentation',
    amount: 450,
    period: 'monthly',
    categoryId: 'food',
    alertThreshold: 75,
    createdAt: now,
    updatedAt: now
  }
]

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'expense-demo-1',
    kind: 'expense',
    title: 'Courses',
    description: 'Courses de la semaine',
    amount: 86.45,
    date: `${month}-04`,
    time: '18:15',
    categoryId: 'groceries',
    subCategoryId: 'groceries',
    accountId: 'current',
    paymentMethod: 'Visa',
    tags: ['maison'],
    recurrence: 'none',
    archived: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'expense-demo-2',
    kind: 'expense',
    title: 'Netflix',
    description: 'Abonnement mensuel',
    amount: 13.49,
    date: `${month}-08`,
    time: '09:00',
    categoryId: 'leisure',
    accountId: 'current',
    paymentMethod: 'CB',
    tags: ['abonnement'],
    recurrence: 'monthly',
    archived: false,
    createdAt: now,
    updatedAt: now
  }
]

export const DEFAULT_INCOME: Income[] = [
  {
    id: 'income-demo-1',
    kind: 'income',
    title: 'Salaire',
    description: 'Revenu principal',
    amount: 2450,
    date: `${month}-01`,
    time: '08:00',
    categoryId: 'salary',
    accountId: 'current',
    paymentMethod: 'Virement',
    tags: ['travail'],
    recurrence: 'monthly',
    archived: false,
    createdAt: now,
    updatedAt: now
  }
]

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-vacances',
    name: 'Vacances',
    targetAmount: 1000,
    currentAmount: 420,
    dueDate: `${new Date().getFullYear()}-08-15`,
    icon: 'Plane',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'goal-pc',
    name: 'PC',
    targetAmount: 1500,
    currentAmount: 650,
    icon: 'Monitor',
    createdAt: now,
    updatedAt: now
  }
]

export const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-netflix',
    name: 'Netflix',
    amount: 13.49,
    renewalDate: `${month}-08`,
    recurrence: 'monthly',
    notifyBeforeDays: 1,
    categoryId: 'leisure',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'sub-chatgpt',
    name: 'ChatGPT',
    amount: 23,
    renewalDate: `${month}-20`,
    recurrence: 'monthly',
    notifyBeforeDays: 2,
    categoryId: 'leisure',
    createdAt: now,
    updatedAt: now
  }
]

export const DEFAULT_DEBTS: Debt[] = [
  {
    id: 'debt-demo-1',
    person: 'Alex',
    amount: 45,
    direction: 'owed_to_me',
    dueDate: `${month}-28`,
    history: [{ date: `${month}-10`, amount: 45, note: 'Restaurant' }],
    createdAt: now,
    updatedAt: now
  }
]
