/** 卡牌数据库在线查询每页条数：可选值与默认值（不可为空） */
export const LIBRARY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100]

export const DEFAULT_LIBRARY_PAGE_SIZE = 20

/**
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeLibraryPageSize(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_LIBRARY_PAGE_SIZE
  const rounded = Math.round(n)
  return LIBRARY_PAGE_SIZE_OPTIONS.includes(rounded) ? rounded : DEFAULT_LIBRARY_PAGE_SIZE
}
