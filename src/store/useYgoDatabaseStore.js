import { create } from 'zustand'
import { isExtraDeckCard, slimCardForDeck } from '../config/ygoCardUtils'
import { queryCards } from '../services/ygoprodeckApi'

const MAX_MAIN = 60
const MAX_EXTRA = 15
const MAX_SIDE = 15
const MAX_COPY = 3

function genDeckId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `deck-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function countInZone(entries, id) {
  const row = entries.find((e) => e.id === id)
  return row ? row.n : 0
}

function uniqueDeckName(baseName, decks, excludeId) {
  const taken = new Set(
    decks
      .filter((d) => d.id !== excludeId)
      .map((d) => String(d.name || '').trim()),
  )
  let name = String(baseName || '').trim() || '未命名卡组'
  if (!taken.has(name)) return name
  let i = 2
  while (taken.has(`${name} (${i})`)) i += 1
  return `${name} (${i})`
}

function ensureDeckRow(d) {
  const now = new Date().toISOString()
  return {
    id: d.id || genDeckId(),
    name: String(d.name ?? '未命名卡组').trim() || '未命名卡组',
    description: String(d.description ?? ''),
    notes: String(d.notes ?? ''),
    createdAt: d.createdAt || now,
    updatedAt: d.updatedAt || now,
    pinned: Boolean(d.pinned),
    main: Array.isArray(d.main) ? d.main : [],
    extra: Array.isArray(d.extra) ? d.extra : [],
    side: Array.isArray(d.side) ? d.side : [],
  }
}

function migrateV1ToV2(v1) {
  const id = genDeckId()
  const now = new Date().toISOString()
  const snaps =
    v1.snapshots && typeof v1.snapshots === 'object' ? v1.snapshots : {}
  return {
    version: 2,
    snapshots: snaps,
    lastActiveDeckId: id,
    lastAddTargetDeckId: null,
    decks: [
      {
        id,
        name: String(v1.name || '我的卡组').trim() || '我的卡组',
        description: '',
        notes: '',
        createdAt: now,
        updatedAt: now,
        pinned: false,
        main: Array.isArray(v1.main) ? v1.main : [],
        extra: Array.isArray(v1.extra) ? v1.extra : [],
        side: [],
      },
    ],
  }
}

function collectUsedCardIds(decks) {
  const used = new Set()
  for (const d of decks) {
    for (const z of ['main', 'extra', 'side']) {
      d[z]?.forEach((e) => used.add(e.id))
    }
  }
  return used
}

function pruneSnapshotsForDecks(decks, snapshots) {
  const used = collectUsedCardIds(decks)
  const next = { ...snapshots }
  Object.keys(next).forEach((k) => {
    const id = Number(k)
    if (!used.has(id)) delete next[id]
  })
  return next
}

function resolveAddTargetDeckId(get, explicitDeckId) {
  if (explicitDeckId) return explicitDeckId
  return get().lastAddTargetDeckId || get().lastActiveDeckId || null
}

/**
 * 将一张卡加入 deck 副本（主/额外），失败返回 reason；成功返回新的 snapshots。
 */
function tryAddOneCardToDeckCopy(deck, card, snapshotsBase) {
  const id = card.id
  if (id == null) {
    return { ok: false, reason: '无效卡牌', deck, snapshots: snapshotsBase }
  }

  const snapNext = {
    ...snapshotsBase,
    [id]: slimCardForDeck(card),
  }

  const extraSlot = isExtraDeckCard(card)

  if (extraSlot) {
    const entries = [...deck.extra]
    const total = entries.reduce((s, e) => s + e.n, 0)
    if (total >= MAX_EXTRA) {
      return { ok: false, reason: '额外卡组已满', deck, snapshots: snapshotsBase }
    }
    if (countInZone(entries, id) >= MAX_COPY) {
      return { ok: false, reason: '同名卡最多 3 张（额外）', deck, snapshots: snapshotsBase }
    }
    const idx = entries.findIndex((e) => e.id === id)
    if (idx >= 0) entries[idx] = { id, n: entries[idx].n + 1 }
    else entries.push({ id, n: 1 })
    deck.extra = entries
  } else {
    const main = [...deck.main]
    const side = deck.side
    const totalMain = main.reduce((s, e) => s + e.n, 0)
    if (totalMain >= MAX_MAIN) {
      return { ok: false, reason: '主卡组已满', deck, snapshots: snapshotsBase }
    }
    const copies = countInZone(main, id) + countInZone(side, id)
    if (copies >= MAX_COPY) {
      return {
        ok: false,
        reason: '同名卡最多 3 张（主卡组+副卡组合计）',
        deck,
        snapshots: snapshotsBase,
      }
    }
    const idx = main.findIndex((e) => e.id === id)
    if (idx >= 0) main[idx] = { id, n: main[idx].n + 1 }
    else main.push({ id, n: 1 })
    deck.main = main
  }

  return { ok: true, deck, snapshots: snapNext }
}

function normalizeFilePayload(raw) {
  if (raw && raw.version === 2 && Array.isArray(raw.decks)) {
    let decks = raw.decks.map(ensureDeckRow).filter(Boolean)
    const snapshots =
      raw.snapshots && typeof raw.snapshots === 'object' ? raw.snapshots : {}
    let lastActiveDeckId = raw.lastActiveDeckId || null
    /** 不再在「零卡组」时自动塞入占位卡组，列表页展示真实空状态 */
    if (lastActiveDeckId && !decks.some((d) => d.id === lastActiveDeckId)) {
      lastActiveDeckId = decks[0]?.id ?? null
    }
    let lastAddTargetDeckId = raw.lastAddTargetDeckId ?? null
    if (
      lastAddTargetDeckId &&
      !decks.some((d) => d.id === lastAddTargetDeckId)
    ) {
      lastAddTargetDeckId = null
    }
    return { version: 2, snapshots, decks, lastActiveDeckId, lastAddTargetDeckId }
  }
  if (raw && typeof raw === 'object') {
    return migrateV1ToV2(raw)
  }
  return {
    version: 2,
    snapshots: {},
    lastActiveDeckId: null,
    lastAddTargetDeckId: null,
    decks: [],
  }
}

const useYgoDatabaseStore = create((set, get) => ({
  /** online：API 分页；local：本地全库（SQLite / 打包 JSON） */
  libraryMode: 'online',

  cards: [],
  meta: null,
  summary: null,
  dbSource: null,

  loading: false,
  error: null,
  missingDb: false,

  filterSearch: '',
  filterType: '',
  filterAttr: '',
  apiPage: 1,
  apiPageSize: 20,
  apiHasMore: false,
  apiError: null,

  /** @type {{ id: string, name: string, description: string, notes: string, createdAt: string, updatedAt: string, main: {id:number,n:number}[], extra: {id:number,n:number}[], side: {id:number,n:number}[]}[]} */
  decks: [],
  /** 首次从磁盘拉取卡组完成后为 true，避免详情页在 decks=[] 时误判跳转 */
  decksLoaded: false,
  lastActiveDeckId: null,
  /** 卡牌数据库「加入卡组」上次选择的目标卡组（用于排序与默认选中） */
  lastAddTargetDeckId: null,
  /** @type {Record<number, Record<string, unknown>>} */
  cardSnapshots: {},

  setLibraryMode: (mode) =>
    set((state) => {
      if (mode === state.libraryMode) return {}
      /** 切换模式时先释放超大数组，避免长时间阻塞渲染 */
      return {
        libraryMode: mode,
        loading: true,
        error: null,
        apiError: null,
        cards: [],
        summary: null,
        meta: null,
        dbSource: null,
        missingDb: false,
        apiPage: mode === 'online' ? 1 : state.apiPage,
      }
    }),

  setFilters: (partial) => set(partial),

  /** 本地全库（用户目录 SQLite，或安装目录打包 JSON） */
  loadLocalDatabase: async () => {
    set({ loading: true, error: null })
    try {
      const electron = typeof window !== 'undefined' ? window.electronAPI : null
      if (!electron?.readYgoDatabase) {
        set({
          loading: false,
          error: '请在 Electron 桌面版使用本地库',
          missingDb: true,
        })
        return
      }
      const dbPromise = electron.readYgoDatabase()
      const sumPromise =
        electron.readYgoSummary?.() ??
        Promise.resolve({ success: false, missing: true })
      const [res, sr] = await Promise.all([dbPromise, sumPromise])
      if (!res.success) {
        set({ loading: false, error: res.error || '读取失败', missingDb: true })
        return
      }
      if (res.missing || !res.data?.length) {
        set({
          cards: [],
          meta: null,
          summary: null,
          loading: false,
          missingDb: true,
          dbSource: null,
          error: null,
        })
        return
      }
      const summary =
        sr.success && !sr.missing ? sr.summary : null
      /** 让出主线程一帧，避免巨型 setState 卡住界面 */
      await new Promise((r) => requestAnimationFrame(() => r()))
      set({
        cards: res.data,
        meta: res.meta,
        summary,
        dbSource: res.source || null,
        loading: false,
        missingDb: false,
        error: null,
      })
    } catch (e) {
      set({
        loading: false,
        error: e.message || String(e),
        missingDb: true,
      })
    }
  },

  /** 在线查询当前页（卡图为 CDN，不落盘） */
  fetchOnlinePage: async (pageOverride) => {
    const page = pageOverride ?? get().apiPage
    set({ loading: true, apiError: null, error: null })
    try {
      const {
        filterSearch,
        filterType,
        filterAttr,
        apiPageSize,
      } = get()
      const offset = (page - 1) * apiPageSize
      const params = {
        num: apiPageSize,
        offset,
      }
      const q = filterSearch.trim()
      if (q) params.fname = q
      if (filterType) params.type = filterType
      if (filterAttr) params.attribute = filterAttr

      const { data } = await queryCards(params)
      set({
        cards: data,
        loading: false,
        missingDb: false,
        apiPage: page,
        apiHasMore: data.length >= apiPageSize,
        apiError: null,
      })
    } catch (e) {
      const msg = e.message || String(e)
      set({
        loading: false,
        apiError: msg,
        apiHasMore: false,
      })
    }
  },

  persistAllDecks: async () => {
    const electron = typeof window !== 'undefined' ? window.electronAPI : null
    if (!electron?.saveYgoDecks) return
    const { cardSnapshots, decks, lastActiveDeckId, lastAddTargetDeckId } =
      get()
    await electron.saveYgoDecks({
      version: 2,
      snapshots: cardSnapshots,
      decks,
      lastActiveDeckId,
      lastAddTargetDeckId,
    })
  },

  loadDecks: async () => {
    const electron = typeof window !== 'undefined' ? window.electronAPI : null
    if (!electron?.readYgoDecks) {
      set({ decksLoaded: true })
      return
    }
    const res = await electron.readYgoDecks()
    if (!res.success || !res.data) {
      set({ decksLoaded: true })
      return
    }
    const normalized = normalizeFilePayload(res.data)
    let { decks, lastActiveDeckId, lastAddTargetDeckId, snapshots } = normalized
    if (lastActiveDeckId && !decks.some((d) => d.id === lastActiveDeckId)) {
      lastActiveDeckId = decks[0]?.id ?? null
    }
    if (
      lastAddTargetDeckId &&
      !decks.some((d) => d.id === lastAddTargetDeckId)
    ) {
      lastAddTargetDeckId = null
    }
    set({
      decks,
      lastActiveDeckId,
      lastAddTargetDeckId,
      cardSnapshots:
        snapshots && typeof snapshots === 'object' ? snapshots : {},
      decksLoaded: true,
    })
  },

  setLastActiveDeckId: (id) => set({ lastActiveDeckId: id }),

  setLastAddTargetDeckId: (id) => {
    set({ lastAddTargetDeckId: id })
    void get().persistAllDecks()
  },

  /** @returns {{ ok: boolean, deckId?: string, reason?: string }} */
  createDeck: (nameHint) => {
    const decks = get().decks
    const name = uniqueDeckName(nameHint || '未命名卡组', decks)
    const id = genDeckId()
    const now = new Date().toISOString()
    const deck = {
      id,
      name,
      description: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
      pinned: false,
      main: [],
      extra: [],
      side: [],
    }
    set((s) => ({
      decks: [...s.decks, deck],
      lastActiveDeckId: id,
    }))
    void get().persistAllDecks()
    return { ok: true, deckId: id }
  },

  deleteDeck: (deckId) => {
    const decks = get().decks.filter((d) => d.id !== deckId)
    let lastActiveDeckId = get().lastActiveDeckId
    if (lastActiveDeckId === deckId) {
      lastActiveDeckId = decks[0]?.id ?? null
    }
    let lastAddTargetDeckId = get().lastAddTargetDeckId
    if (lastAddTargetDeckId === deckId) {
      lastAddTargetDeckId = null
    }
    const cardSnapshots = pruneSnapshotsForDecks(decks, get().cardSnapshots)
    set({ decks, lastActiveDeckId, lastAddTargetDeckId, cardSnapshots })
    void get().persistAllDecks()
  },

  /** 置顶 / 取消置顶（持久化） */
  toggleDeckPinned: (deckId) => {
    const decks = get().decks.map((d) =>
      d.id === deckId ? { ...d, pinned: !Boolean(d.pinned) } : d,
    )
    set({ decks })
    void get().persistAllDecks()
  },

  /**
   * @returns {{ ok: boolean, reason?: string }}
   */
  updateDeckMeta: (deckId, partial) => {
    const decks = get().decks
    const cur = decks.find((d) => d.id === deckId)
    if (!cur) return { ok: false, reason: '卡组不存在' }
    if (partial.name != null) {
      const name = String(partial.name).trim()
      if (!name) return { ok: false, reason: '卡组名称不能为空' }
      if (decks.some((d) => d.id !== deckId && d.name.trim() === name)) {
        return { ok: false, reason: '已存在同名卡组' }
      }
    }
    const now = new Date().toISOString()
    const nextDecks = decks.map((d) => {
      if (d.id !== deckId) return d
      const next = { ...d, ...partial, updatedAt: now }
      if (partial.name != null) {
        next.name = String(partial.name).trim()
      }
      return next
    })
    set({ decks: nextDecks })
    void get().persistAllDecks()
    return { ok: true }
  },

  /**
   * @param {string} deckId
   * @param {string} rawName
   * @returns {{ ok: boolean, reason?: string }}
   */
  setDeckNameValidated: (deckId, rawName) => {
    const name = String(rawName ?? '').trim()
    if (!name) return { ok: false, reason: '卡组名称不能为空' }
    const decks = get().decks
    if (decks.some((d) => d.id !== deckId && d.name.trim() === name)) {
      return { ok: false, reason: '已存在同名卡组' }
    }
    const now = new Date().toISOString()
    set({
      decks: decks.map((d) =>
        d.id === deckId ? { ...d, name, updatedAt: now } : d,
      ),
    })
    void get().persistAllDecks()
    return { ok: true }
  },

  /**
   * @param {unknown} card
   * @param {string} [targetDeckId] 指定卡组；不传则用上次加入目标或当前活跃卡组
   */
  addCardToDeck: (card, targetDeckId) => {
    const activeId = resolveAddTargetDeckId(get, targetDeckId)
    if (!activeId) {
      return {
        ok: false,
        reason: '请先创建一个卡组，或在弹窗中选择目标卡组',
      }
    }
    const decks = [...get().decks]
    const di = decks.findIndex((d) => d.id === activeId)
    if (di < 0) {
      return { ok: false, reason: '目标卡组不存在，请返回卡组列表' }
    }
    let deck = {
      ...decks[di],
      main: [...decks[di].main],
      extra: [...decks[di].extra],
      side: [...decks[di].side],
    }
    let snaps = { ...get().cardSnapshots }
    const r = tryAddOneCardToDeckCopy(deck, card, snaps)
    if (!r.ok) return { ok: false, reason: r.reason }
    deck = r.deck
    snaps = r.snapshots
    deck.updatedAt = new Date().toISOString()
    decks[di] = deck
    set({
      decks,
      cardSnapshots: snaps,
      lastAddTargetDeckId: activeId,
    })
    void get().persistAllDecks()
    return { ok: true }
  },

  /**
   * 批量加入同一卡组，任意一张失败则整体失败（原子性）。
   * @param {unknown[]} cards
   * @param {string} targetDeckId
   */
  addCardsToDeck: (cards, targetDeckId) => {
    const activeId = resolveAddTargetDeckId(get, targetDeckId)
    if (!activeId) {
      return {
        ok: false,
        reason: '请选择目标卡组',
      }
    }
    const decks = [...get().decks]
    const di = decks.findIndex((d) => d.id === activeId)
    if (di < 0) {
      return { ok: false, reason: '目标卡组不存在' }
    }
    let deck = {
      ...decks[di],
      main: [...decks[di].main],
      extra: [...decks[di].extra],
      side: [...decks[di].side],
    }
    let snaps = { ...get().cardSnapshots }
    for (const card of cards) {
      const r = tryAddOneCardToDeckCopy(deck, card, snaps)
      if (!r.ok) return { ok: false, reason: r.reason }
      deck = r.deck
      snaps = r.snapshots
    }
    deck.updatedAt = new Date().toISOString()
    decks[di] = deck
    set({
      decks,
      cardSnapshots: snaps,
      lastAddTargetDeckId: activeId,
    })
    void get().persistAllDecks()
    return { ok: true }
  },

  removeOneFromDeck: (deckId, cardId, zone) => {
    const decks = [...get().decks]
    const di = decks.findIndex((d) => d.id === deckId)
    if (di < 0) return
    const deck = { ...decks[di] }
    const key = zone === 'extra' ? 'extra' : zone === 'side' ? 'side' : 'main'
    let arr = [...deck[key]]
    const idx = arr.findIndex((e) => e.id === cardId)
    if (idx < 0) return
    const n = arr[idx].n - 1
    if (n <= 0) arr.splice(idx, 1)
    else arr[idx] = { id: cardId, n }
    deck[key] = arr

    const leftInDeck =
      countInZone(deck.main, cardId) +
      countInZone(deck.extra, cardId) +
      countInZone(deck.side, cardId)

    deck.updatedAt = new Date().toISOString()
    decks[di] = deck
    let snapshots = { ...get().cardSnapshots }
    if (leftInDeck <= 0) {
      snapshots = pruneSnapshotsForDecks(decks, snapshots)
    }
    set({ decks, cardSnapshots: snapshots })
    void get().persistAllDecks()
  },

  /**
   * 主卡组 ↔ 副卡组 各移动 1 张（同名卡规则已在两侧合计中满足）
   * @param {boolean} toSide true：主→副；false：副→主
   * @returns {{ ok: boolean, reason?: string }}
   */
  shiftMainSide: (deckId, cardId, toSide) => {
    const decks = [...get().decks]
    const di = decks.findIndex((d) => d.id === deckId)
    if (di < 0) return { ok: false, reason: '卡组不存在' }
    const deck = { ...decks[di] }
    const card = get().cardById(cardId)
    if (!card) return { ok: false, reason: '找不到卡牌数据' }

    if (toSide) {
      if (isExtraDeckCard(card)) {
        return { ok: false, reason: '额外卡组怪兽不能放入副卡组' }
      }
      const sideTotal = deck.side.reduce((s, e) => s + e.n, 0)
      if (sideTotal >= MAX_SIDE) return { ok: false, reason: '副卡组已满' }
      const main = [...deck.main]
      const mi = main.findIndex((e) => e.id === cardId)
      if (mi < 0 || main[mi].n <= 0) {
        return { ok: false, reason: '主卡组中没有该卡' }
      }
      const mn = main[mi].n - 1
      if (mn <= 0) main.splice(mi, 1)
      else main[mi] = { id: cardId, n: mn }
      const side = [...deck.side]
      const si = side.findIndex((e) => e.id === cardId)
      if (si >= 0) side[si] = { id: cardId, n: side[si].n + 1 }
      else side.push({ id: cardId, n: 1 })
      deck.main = main
      deck.side = side
    } else {
      const mainTotal = deck.main.reduce((s, e) => s + e.n, 0)
      if (mainTotal >= MAX_MAIN) return { ok: false, reason: '主卡组已满' }
      const side = [...deck.side]
      const si = side.findIndex((e) => e.id === cardId)
      if (si < 0 || side[si].n <= 0) {
        return { ok: false, reason: '副卡组中没有该卡' }
      }
      const sn = side[si].n - 1
      if (sn <= 0) side.splice(si, 1)
      else side[si] = { id: cardId, n: sn }
      const main = [...deck.main]
      const mi = main.findIndex((e) => e.id === cardId)
      if (mi >= 0) main[mi] = { id: cardId, n: main[mi].n + 1 }
      else main.push({ id: cardId, n: 1 })
      deck.main = main
      deck.side = side
    }

    deck.updatedAt = new Date().toISOString()
    decks[di] = deck
    set({ decks })
    void get().persistAllDecks()
    return { ok: true }
  },

  clearDeckZones: (deckId) => {
    const now = new Date().toISOString()
    const decks = get().decks.map((d) =>
      d.id === deckId
        ? {
            ...d,
            main: [],
            extra: [],
            side: [],
            updatedAt: now,
          }
        : d,
    )
    const snaps = pruneSnapshotsForDecks(decks, get().cardSnapshots)
    set({ decks, cardSnapshots: snaps })
    void get().persistAllDecks()
  },

  cardById: (id) => {
    const snaps = get().cardSnapshots
    const snap = snaps[id] ?? snaps[String(id)]
    if (snap) return snap
    return get().cards.find((c) => c.id === id)
  },
}))

export default useYgoDatabaseStore
