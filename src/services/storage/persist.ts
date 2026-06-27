import type { PiniaPluginContext } from 'pinia'
import type { StateTree } from 'pinia'
import { watch } from 'vue'

import { localStorageService } from '@/services/storage/localStorageService'
import { AUTH_USER_ID_KEY } from '@/stores/useAuthStore'

const PERSISTED_STORES = new Set([
  'expenses',
  'income',
  'budgets',
  'categories',
  'settings',
  'goals',
  'subscriptions',
  'debts',
  'accounts'
])

export const localPersistPlugin = ({ store }: PiniaPluginContext) => {
  if (!PERSISTED_STORES.has(store.$id)) return

  const userId = window.localStorage.getItem(AUTH_USER_ID_KEY) ?? 'anonymous'
  const key = `gestion-depense:${userId}:${store.$id}`
  const savedState = localStorageService.get<StateTree | null>(key, null)
  if (savedState) store.$patch(savedState)

  watch(
    () => store.$state,
    (state) => localStorageService.set(key, state),
    { deep: true }
  )
}
