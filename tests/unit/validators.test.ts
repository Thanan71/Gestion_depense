import { describe, expect, it } from 'vitest'

import { validateTransaction } from '@/utils/validators'

describe('validateTransaction', () => {
  it('accepts a valid transaction', () => {
    expect(validateTransaction({ title: 'Courses', amount: 42, date: '2026-06-27' }).valid).toBe(
      true
    )
  })

  it('returns errors for missing fields', () => {
    const result = validateTransaction({ title: '', amount: 0, date: '' })

    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
    expect(result.errors.amount).toBeTruthy()
    expect(result.errors.date).toBeTruthy()
  })
})
