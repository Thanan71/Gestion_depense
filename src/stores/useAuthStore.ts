import { defineStore } from 'pinia'

import { authService } from '@/services/auth/authService'
import type { AuthUser } from '@/types/auth'

const AUTH_USER_KEY = 'gestion-depense:auth-user'
export const AUTH_USER_ID_KEY = 'gestion-depense:auth-user-id'

const readStoredUser = (): AuthUser | null => {
  const raw = window.localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

const storeUser = (user: AuthUser | null) => {
  if (!user) {
    window.localStorage.removeItem(AUTH_USER_KEY)
    window.localStorage.removeItem(AUTH_USER_ID_KEY)
    return
  }

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  window.localStorage.setItem(AUTH_USER_ID_KEY, user.id)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser() as AuthUser | null,
    initialized: false,
    loading: false,
    error: ''
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user)
  },
  actions: {
    setUser(user: AuthUser | null) {
      this.user = user
      storeUser(user)
    },
    async fetchMe() {
      this.loading = true
      try {
        const response = await authService.me()
        this.setUser(response.ok && response.user ? response.user : null)
        this.initialized = true
      } finally {
        this.loading = false
      }
    },
    async login(email: string, password: string) {
      this.error = ''
      const response = await authService.login(email, password)
      if (!response.ok || !response.user) {
        this.error = response.message ?? 'Connexion impossible.'
        return false
      }
      this.setUser(response.user)
      this.initialized = true
      return true
    },
    async register(email: string, password: string, displayName: string) {
      this.error = ''
      const response = await authService.register(email, password, displayName)
      if (!response.ok || !response.user) {
        this.error = response.message ?? 'Inscription impossible.'
        return false
      }
      this.setUser(response.user)
      this.initialized = true
      return true
    },
    async logout() {
      await authService.logout()
      this.setUser(null)
      this.initialized = true
    }
  }
})
