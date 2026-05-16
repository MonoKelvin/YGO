/** 内置默认卡组（始终存在、列表始终展示、不可删除） */
export const DEFAULT_DECK_ID = 'ygo-default-deck'
export const DEFAULT_DECK_NAME = '默认卡组'

export function isDefaultDeckId(deckId) {
  return deckId === DEFAULT_DECK_ID
}

/** 卡组内卡牌张数合计（按份数 n 计） */
export function deckCardCount(deck) {
  if (!deck) return 0
  const sum = (entries) =>
    (Array.isArray(entries) ? entries : []).reduce((s, e) => s + (e.n || 0), 0)
  return sum(deck.main) + sum(deck.extra) + sum(deck.side)
}

export function isDeckEmpty(deck) {
  return deckCardCount(deck) === 0
}

/** 我的卡组列表：展示全部卡组（含空卡组） */
export function isDeckVisibleInList(deck) {
  return Boolean(deck?.id)
}

/** 加入卡组选择器：默认卡组始终显示，其余仅展示已放入卡牌的非空卡组 */
export function isDeckVisibleInAddPicker(deck) {
  if (!deck) return false
  if (isDefaultDeckId(deck.id)) return true
  return !isDeckEmpty(deck)
}

export function createDefaultDeckRow() {
  const now = new Date().toISOString()
  return {
    id: DEFAULT_DECK_ID,
    name: DEFAULT_DECK_NAME,
    description: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    pinned: true,
    main: [],
    extra: [],
    side: [],
  }
}

/**
 * 保证 decks 中含且仅含一个默认卡组，并置于首位
 * @param {Array<Record<string, unknown>>} decks
 */
export function ensureDefaultDeckInList(decks) {
  const list = Array.isArray(decks) ? [...decks] : []
  const ix = list.findIndex((d) => d?.id === DEFAULT_DECK_ID)
  if (ix >= 0) {
    const row = { ...list[ix], id: DEFAULT_DECK_ID }
    list.splice(ix, 1)
    list.unshift(row)
    return list
  }
  return [createDefaultDeckRow(), ...list]
}
