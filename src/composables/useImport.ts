import { backupService } from '@/services/backup/backupService'

export const useImport = () => ({
  importJson: backupService.importJson
})
