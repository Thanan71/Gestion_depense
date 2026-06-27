import type { StoreGeneric } from 'pinia'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { remoteSyncService } from '@/services/sync/remoteSyncService'
import { useAccountStore } from '@/stores/useAccountStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useDebtStore } from '@/stores/useDebtStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGoalStore } from '@/stores/useGoalStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useSubscriptionStore } from '@/stores/useSubscriptionStore'
import type { AppSnapshot } from '@/types/sync'

const SYNC_ENABLED = import.meta.env.VITE_SYNC_ENABLED === 'true'
const SYNC_PROVIDER = import.meta.env.VITE_SYNC_PROVIDER
const SYNC_META_PREFIX = 'gestion-depense:remote-sync'
const SYNC_CONFLICT_PREFIX = 'gestion-depense:remote-sync-conflict'

type SyncStatus = 'disabled' | 'loading' | 'synced' | 'offline' | 'error'

interface SyncMeta {
  revisionId: string | null
  pending: boolean
  updatedAt?: string
}

const defaultSyncMeta = (): SyncMeta => ({
  revisionId: null,
  pending: false
})

const trackedStores = (): StoreGeneric[] => [
  useExpenseStore(),
  useIncomeStore(),
  useBudgetStore(),
  useCategoryStore(),
  useSettingsStore(),
  useGoalStore(),
  useSubscriptionStore(),
  useDebtStore(),
  useAccountStore()
]

const createSnapshot = (stores: StoreGeneric[], baseRevisionId: string | null): AppSnapshot => ({
  version: 2,
  exportedAt: new Date().toISOString(),
  baseRevisionId,
  stores: Object.fromEntries(
    stores.map((store) => [store.$id, JSON.parse(JSON.stringify(store.$state))])
  )
})

const syncMetaKey = (userId: string) => `${SYNC_META_PREFIX}:${userId}`

const readSyncMeta = (userId: string): SyncMeta => {
  const raw = window.localStorage.getItem(syncMetaKey(userId))
  if (!raw) return defaultSyncMeta()

  try {
    return { ...defaultSyncMeta(), ...(JSON.parse(raw) as Partial<SyncMeta>) }
  } catch {
    return defaultSyncMeta()
  }
}

const writeSyncMeta = (userId: string, meta: SyncMeta) => {
  window.localStorage.setItem(
    syncMetaKey(userId),
    JSON.stringify({ ...meta, updatedAt: new Date().toISOString() })
  )
}

const isOnline = () => navigator.onLine

const conflictSnapshotKey = (userId: string) => `${SYNC_CONFLICT_PREFIX}:${userId}:${Date.now()}`

export const useRemoteSync = () => {
  const status = ref<SyncStatus>('disabled')
  const notificationStore = useNotificationStore()
  const authStore = useAuthStore()

  let stopStoreWatcher: (() => void) | undefined
  let syncTimeout: number | undefined
  let syncing = false
  let queuedSync = false
  let applyingRemoteSnapshot = false
  let lastOfflineNotificationAt = 0

  const notifyOffline = () => {
    const now = Date.now()
    if (now - lastOfflineNotificationAt < 30_000) return
    lastOfflineNotificationAt = now
    notificationStore.push({
      title: 'Synchronisation en attente',
      message: 'Les changements restent sur ce téléphone et partiront quand Internet revient.',
      type: 'warning'
    })
  }

  const scheduleSync = () => {
    window.clearTimeout(syncTimeout)
    syncTimeout = window.setTimeout(() => {
      void startSync()
    }, 800)
  }

  const installStoreWatcher = (userId: string, stores: StoreGeneric[]) => {
    stopStoreWatcher?.()
    stopStoreWatcher = watch(
      () => stores.map((store) => store.$state),
      () => {
        if (applyingRemoteSnapshot) return

        const meta = readSyncMeta(userId)
        writeSyncMeta(userId, { ...meta, pending: true })

        if (!isOnline()) {
          status.value = 'offline'
          notifyOffline()
          return
        }

        scheduleSync()
      },
      { deep: true }
    )
  }

  const applySnapshot = async (stores: StoreGeneric[], snapshot: AppSnapshot) => {
    applyingRemoteSnapshot = true
    for (const store of stores) {
      const savedState = snapshot.stores[store.$id]
      if (savedState) store.$patch(savedState)
    }
    await nextTick()
    applyingRemoteSnapshot = false
  }

  const pushLocalSnapshot = async (
    userId: string,
    stores: StoreGeneric[],
    baseRevisionId: string | null
  ) => {
    const snapshot = createSnapshot(stores, baseRevisionId)
    const pushed = await remoteSyncService.push(snapshot)
    if (!pushed.ok && pushed.status === 409) {
      window.localStorage.setItem(conflictSnapshotKey(userId), JSON.stringify(snapshot))

      const pulled = await remoteSyncService.pull()
      if (pulled.ok && pulled.snapshot) {
        await applySnapshot(stores, pulled.snapshot)
        writeSyncMeta(userId, {
          revisionId: pulled.snapshot.revisionId ?? pushed.revisionId ?? null,
          pending: false
        })
      } else {
        writeSyncMeta(userId, {
          revisionId: pushed.revisionId ?? baseRevisionId,
          pending: false
        })
      }

      throw new Error(
        'Conflit de synchronisation : les données locales ont été sauvegardées en secours et la version distante a été rechargée.'
      )
    }

    if (!pushed.ok) throw new Error(pushed.message ?? 'Remote push failed.')

    writeSyncMeta(userId, {
      revisionId: pushed.revisionId ?? null,
      pending: false
    })
  }

  const startSync = async () => {
    if (!SYNC_ENABLED || SYNC_PROVIDER !== 'postgres' || !authStore.user) {
      stopStoreWatcher?.()
      status.value = 'disabled'
      return
    }

    const userId = authStore.user.id
    const stores = trackedStores()
    installStoreWatcher(userId, stores)

    if (!isOnline()) {
      status.value = 'offline'
      notifyOffline()
      return
    }

    if (syncing) {
      queuedSync = true
      return
    }

    syncing = true
    status.value = 'loading'

    try {
      const meta = readSyncMeta(userId)

      if (meta.pending) {
        await pushLocalSnapshot(userId, stores, meta.revisionId)
      } else {
        const pulled = await remoteSyncService.pull()
        if (!pulled.ok) throw new Error(pulled.message ?? 'Remote sync failed.')

        const revisionId = pulled.snapshot?.revisionId ?? pulled.revisionId ?? meta.revisionId

        if (pulled.snapshot?.stores) {
          await applySnapshot(stores, pulled.snapshot)
          writeSyncMeta(userId, {
            revisionId: revisionId ?? null,
            pending: false
          })
        } else {
          await pushLocalSnapshot(userId, stores, revisionId ?? null)
        }
      }

      await nextTick()
      status.value = 'synced'
    } catch (error) {
      applyingRemoteSnapshot = false
      status.value = isOnline() ? 'error' : 'offline'
      notificationStore.push({
        title: status.value === 'error' ? 'Synchronisation bloquée' : 'Synchronisation en attente',
        message:
          error instanceof Error
            ? error.message
            : 'Les données restent sauvegardées localement dans le navigateur.',
        type: status.value === 'error' ? 'error' : 'warning'
      })
    } finally {
      syncing = false
      if (queuedSync) {
        queuedSync = false
        scheduleSync()
      }
    }
  }

  watch(() => authStore.user?.id, startSync, { immediate: true })

  const syncWhenOnline = () => {
    void startSync()
  }

  const syncWhenVisible = () => {
    if (document.visibilityState === 'visible') void startSync()
  }

  onMounted(() => {
    window.addEventListener('online', syncWhenOnline)
    window.addEventListener('offline', notifyOffline)
    document.addEventListener('visibilitychange', syncWhenVisible)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', syncWhenOnline)
    window.removeEventListener('offline', notifyOffline)
    document.removeEventListener('visibilitychange', syncWhenVisible)
    window.clearTimeout(syncTimeout)
    stopStoreWatcher?.()
  })

  return { status }
}
