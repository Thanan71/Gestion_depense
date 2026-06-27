import { describe, expect, it } from 'vitest'

import type { AppSnapshot } from '@/types/sync'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { validateSnapshotForSync } from '@/utils/snapshotValidation'

const baseSnapshot = (patch: Partial<AppSnapshot> = {}): AppSnapshot => ({
  version: 2,
  exportedAt: '2026-06-27T12:00:00.000Z',
  stores: {},
  ...patch
})

describe('validateSnapshotForSync', () => {
  it('accepts a valid snapshot', () => {
    const result = validateSnapshotForSync(
      baseSnapshot({
        stores: {
          settings: { settings: DEFAULT_SETTINGS },
          accounts: {
            accounts: [{ id: 'current', name: 'Compte courant', type: 'bank', balance: 0 }]
          }
        }
      })
    )

    expect(result.valid).toBe(true)
  })

  it('rejects duplicate ids in a collection', () => {
    const result = validateSnapshotForSync(
      baseSnapshot({
        stores: {
          accounts: {
            accounts: [
              { id: 'current', name: 'Compte courant', type: 'bank', balance: 0 },
              { id: 'current', name: 'Compte courant bis', type: 'bank', balance: 0 }
            ]
          }
        }
      })
    )

    expect(result.valid).toBe(false)
  })

  it('rejects invalid transaction dates', () => {
    const result = validateSnapshotForSync(
      baseSnapshot({
        stores: {
          expenses: {
            expenses: [
              {
                id: 'expense_1',
                kind: 'expense',
                title: 'Achat',
                description: '',
                amount: 12,
                date: '27/06/2026',
                time: '12:00',
                categoryId: 'misc',
                accountId: 'current',
                paymentMethod: 'CB',
                tags: [],
                recurrence: 'none',
                archived: false,
                createdAt: '2026-06-27T12:00:00.000Z',
                updatedAt: '2026-06-27T12:00:00.000Z'
              }
            ]
          }
        }
      })
    )

    expect(result.valid).toBe(false)
  })
})
