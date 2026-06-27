import { defineStore } from 'pinia'

import type { Account } from '@/types/finance'
import { DEFAULT_ACCOUNTS, initialDefaultItems } from '@/utils/constants'
import { createId } from '@/utils/helpers'

export const useAccountStore = defineStore('accounts', {
  state: () => ({
    accounts: initialDefaultItems(DEFAULT_ACCOUNTS) as Account[]
  }),
  getters: {
    totalBalance: (state) => state.accounts.reduce((sum, account) => sum + account.balance, 0),
    byId: (state) => (id?: string) => state.accounts.find((account) => account.id === id)
  },
  actions: {
    add(payload: Omit<Account, 'id'>) {
      this.accounts.push({ ...payload, id: createId('account') })
    },
    update(id: string, patch: Partial<Account>) {
      const account = this.accounts.find((item) => item.id === id)
      if (account) Object.assign(account, patch)
    },
    remove(id: string) {
      this.accounts = this.accounts.filter((account) => account.id !== id)
    }
  }
})
