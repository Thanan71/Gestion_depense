import { localStorageService } from '@/services/storage/localStorageService'

const PREFIX = 'gestion-depense:'

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`

export const backupService = {
  exportJson() {
    const data = Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .reduce<Record<string, unknown>>((backup, key) => {
        backup[key] = localStorageService.get(key, null)
        return backup
      }, {})

    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2)
  },
  importJson(json: string) {
    const parsed = JSON.parse(json) as { data: Record<string, unknown> }
    for (const [key, value] of Object.entries(parsed.data)) {
      localStorageService.set(key, value)
    }
  },
  exportCsv(rows: Array<Record<string, unknown>>) {
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
    const body = rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
    return [headers.join(','), ...body].join('\n')
  }
}
