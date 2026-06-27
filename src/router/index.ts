import { createRouter, createWebHistory } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/useAuthStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/pages/AuthPage.vue') },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue') },
        { path: 'expenses', name: 'expenses', component: () => import('@/pages/ExpensesPage.vue') },
        {
          path: 'expenses/new',
          name: 'expense-new',
          component: () => import('@/pages/ExpenseFormPage.vue')
        },
        {
          path: 'expenses/edit/:id',
          name: 'expense-edit',
          component: () => import('@/pages/ExpenseFormPage.vue')
        },
        { path: 'income', name: 'income', component: () => import('@/pages/IncomePage.vue') },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/pages/CategoriesPage.vue')
        },
        { path: 'accounts', name: 'accounts', component: () => import('@/pages/AccountsPage.vue') },
        { path: 'budgets', name: 'budgets', component: () => import('@/pages/BudgetsPage.vue') },
        {
          path: 'statistics',
          name: 'statistics',
          component: () => import('@/pages/StatisticsPage.vue')
        },
        { path: 'calendar', name: 'calendar', component: () => import('@/pages/CalendarPage.vue') },
        { path: 'goals', name: 'goals', component: () => import('@/pages/GoalsPage.vue') },
        {
          path: 'subscriptions',
          name: 'subscriptions',
          component: () => import('@/pages/SubscriptionsPage.vue')
        },
        { path: 'debts', name: 'debts', component: () => import('@/pages/DebtsPage.vue') },
        { path: 'reports', name: 'reports', component: () => import('@/pages/ReportsPage.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/pages/SettingsPage.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/pages/ProfilePage.vue') },
        { path: 'about', name: 'about', component: () => import('@/pages/AboutPage.vue') }
      ]
    },
    { path: '/not-found', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/not-found' }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.fetchMe()
  }

  if (to.name === 'login') {
    if (authStore.isAuthenticated) return '/'
    return true
  }

  return authStore.isAuthenticated ? true : { name: 'login' }
})

export default router
