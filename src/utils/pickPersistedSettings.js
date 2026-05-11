/**
 * 从磁盘读回的原始对象中挑出写入 Zustand `settings` 的字段，避免信任未知键。
 */
export function pickPersistedSettings(raw) {
  if (!raw || typeof raw !== 'object') return {}

  const out = {}

  if (raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system') {
    out.theme = raw.theme
  }

  if (raw.language === 'cn' || raw.language === 'en') {
    out.language = raw.language
  }

  if (typeof raw.autoSave === 'boolean') {
    out.autoSave = raw.autoSave
  }

  const ps = Number(raw.libraryPageSize)
  if (Number.isFinite(ps) && ps > 0) {
    out.libraryPageSize = Math.round(ps)
  }

  if (Array.isArray(raw.favoriteCardIds)) {
    out.favoriteCardIds = raw.favoriteCardIds.filter((n) => Number.isFinite(n))
  }

  if (typeof raw.lastRoute === 'string' && raw.lastRoute.startsWith('/')) {
    out.lastRoute = raw.lastRoute
  }

  if (typeof raw.sidebarCollapsed === 'boolean') {
    out.sidebarCollapsed = raw.sidebarCollapsed
  }

  return out
}
