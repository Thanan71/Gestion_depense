import { backupService } from '@/services/backup/backupService'

export const useExport = () => ({
  exportJson: backupService.exportJson,
  exportCsv: backupService.exportCsv
})
