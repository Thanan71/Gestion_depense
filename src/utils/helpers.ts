export const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const todayIso = () => new Date().toISOString().slice(0, 10)

export const currentTime = () =>
  new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)
