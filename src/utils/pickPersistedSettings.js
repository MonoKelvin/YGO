import { DEFAULT_LIBRARY_PAGE_SIZE, normalizeLibraryPageSize } from '../config/librarySettings'
import { resolveThemePrimaryColor } from '../config/lobePrimaryColor'

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

  if (raw.libraryPageSize != null && raw.libraryPageSize !== '') {
    out.libraryPageSize = normalizeLibraryPageSize(raw.libraryPageSize)
  } else {
    out.libraryPageSize = DEFAULT_LIBRARY_PAGE_SIZE
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

  if ('primaryColor' in raw) {
    out.primaryColor = resolveThemePrimaryColor(raw.primaryColor)
  }

  return out
}
