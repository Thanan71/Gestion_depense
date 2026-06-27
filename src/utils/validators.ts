export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export const validateAmount = (amount: number) => Number.isFinite(amount) && amount > 0

export const validateRequired = (value: string) => value.trim().length > 0

export const validateTransaction = (payload: {
  title: string
  amount: number
  date: string
}): ValidationResult => {
  const errors: Record<string, string> = {}

  if (!validateRequired(payload.title)) errors.title = 'Le titre est obligatoire.'
  if (!validateAmount(payload.amount)) errors.amount = 'Le montant doit être supérieur à 0.'
  if (!validateRequired(payload.date)) errors.date = 'La date est obligatoire.'

  return { valid: Object.keys(errors).length === 0, errors }
}
