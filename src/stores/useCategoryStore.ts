import { defineStore } from 'pinia'

import type { Category } from '@/types/finance'
import { DEFAULT_CATEGORIES } from '@/utils/constants'
import { createId } from '@/utils/helpers'

export const useCategoryStore = defineStore('categories', {
  state: () => ({
    categories: DEFAULT_CATEGORIES as Category[]
  }),
  getters: {
    byId: (state) => (id?: string) => state.categories.find((category) => category.id === id),
    rootCategories: (state) => state.categories.filter((category) => !category.parentId),
    childrenOf: (state) => (parentId: string) =>
      state.categories.filter((category) => category.parentId === parentId)
  },
  actions: {
    add(payload: Omit<Category, 'id'>) {
      this.categories.push({ ...payload, id: createId('category') })
    },
    upsert(category: Category) {
      const index = this.categories.findIndex((item) => item.id === category.id)
      if (index >= 0) this.categories[index] = category
      else this.categories.push(category)
    },
    remove(id: string) {
      this.categories = this.categories.filter(
        (category) => category.id !== id && category.parentId !== id
      )
    }
  }
})
