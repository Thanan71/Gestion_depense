export const syncService = {
  enabled: false,
  provider: 'local' as 'local' | 'supabase' | 'firebase' | 'dotnet',
  async syncNow() {
    return { ok: true, provider: this.provider, syncedAt: new Date().toISOString() }
  }
}
