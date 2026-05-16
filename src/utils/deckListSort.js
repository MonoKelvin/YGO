import { deckCardCount, isDefaultDeckId } from '../config/deckConstants'

/** 卡组列表排序选项（不含默认卡组，默认卡组始终置顶） */
export const DECK_LIST_SORT_OPTIONS = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '修改时间' },
  { value: 'name', label: '名称' },
  { value: 'cardCount', label: '卡牌数量' },
  { value: 'pinned', label: '置顶优先' },
]

export const DEFAULT_DECK_LIST_SORT_KEY = 'createdAt'

export function getDeckSortLabel(sortKey) {
  return (
    DECK_LIST_SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? '排序'
  )
}

/**
 * @param {Array<Record<string, unknown>>} decks
 * @param {string} query
 */
export function filterDecksBySearchQuery(decks, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return decks
  return decks.filter((deck) => {
    const text = [deck.name, deck.description, deck.notes]
      .map((s) => String(s ?? '').toLowerCase())
      .join('\n')
    return text.includes(q)
  })
}

function compareDecks(a, b, sortKey) {
  if (sortKey === 'name') {
    return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN')
  }
  if (sortKey === 'createdAt') {
    return new Date(a.createdAt) - new Date(b.createdAt)
  }
  if (sortKey === 'cardCount') {
    return deckCardCount(a) - deckCardCount(b)
  }
  if (sortKey === 'pinned') {
    const ap = Boolean(a.pinned)
    const bp = Boolean(b.pinned)
    if (ap !== bp) return ap ? -1 : 1
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  }
  // updatedAt（默认）
  return new Date(a.updatedAt) - new Date(b.updatedAt)
}

/**
 * 默认卡组固定首位，其余按 sortKey 降序（名称除外为升序）
 * @param {Array<Record<string, unknown>>} decks
 * @param {string} sortKey
 */
export function sortDecksForList(decks, sortKey = DEFAULT_DECK_LIST_SORT_KEY) {
  const defaultDeck = decks.find((d) => isDefaultDeckId(d.id))
  const rest = decks.filter((d) => !isDefaultDeckId(d.id))
  const asc = sortKey === 'name'
  rest.sort((a, b) => {
    const c = compareDecks(a, b, sortKey)
    return asc ? c : -c
  })
  return defaultDeck ? [defaultDeck, ...rest] : rest
}
