import { defineStore } from 'pinia'

import type { Goal } from '@/types/finance'
import { DEFAULT_GOALS } from '@/utils/constants'
import { clamp, createId } from '@/utils/helpers'

export const useGoalStore = defineStore('goals', {
  state: () => ({
    goals: DEFAULT_GOALS as Goal[]
  }),
  getters: {
    progress: () => (goal: Goal) =>
      goal.targetAmount > 0
        ? clamp(Math.round((goal.currentAmount / goal.targetAmount) * 100), 0, 100)
        : 0
  },
  actions: {
    add(payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      this.goals.push({ ...payload, id: createId('goal'), createdAt: now, updatedAt: now })
    },
    contribute(id: string, amount: number) {
      const goal = this.goals.find((item) => item.id === id)
      if (!goal) return
      goal.currentAmount = clamp(goal.currentAmount + amount, 0, goal.targetAmount)
      goal.updatedAt = new Date().toISOString()
    },
    update(id: string, patch: Partial<Goal>) {
      const goal = this.goals.find((item) => item.id === id)
      if (goal) Object.assign(goal, patch, { updatedAt: new Date().toISOString() })
    },
    remove(id: string) {
      this.goals = this.goals.filter((goal) => goal.id !== id)
    }
  }
})
