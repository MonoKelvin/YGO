import { create } from 'zustand'
import { DEFAULT_CARD, normalizeCard } from '../config/cardConstants'
import { DEFAULT_LIBRARY_PAGE_SIZE } from '../config/librarySettings'

/** 将 DIY 卡牌列表写入磁盘（失败仅打日志，不打断 UI） */
function schedulePersistDiyCards() {
  queueMicrotask(() => {
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (!api?.saveCards) return
    const cards = useCardStore.getState().cards
    void api.saveCards(cards).then((res) => {
      if (res && res.success === false && res.error) {
        console.error('[saveCards]', res.error)
      }
    }).catch((err) => {
      console.error('[saveCards]', err)
    })
  })
}

const useCardStore = create((set) => ({
  cards: [],
  currentCard: normalizeCard({ ...DEFAULT_CARD }),
  settings: {
    language: 'cn',
    /** 默认跟随系统明暗（与设置页「跟随系统」一致） */
    theme: 'system',
    /** null：不传 customTheme.primaryColor，使用 Lobe 内置主色；否则为预设名如 blue */
    primaryColor: null,
    autoSave: true,
    /** 卡牌数据库在线分页条数 */
    libraryPageSize: DEFAULT_LIBRARY_PAGE_SIZE,
    /** 收藏的官方卡牌 id（YGOProDeck） */
    favoriteCardIds: [],
    /** 上次路由（含 query），下次启动恢复 */
    lastRoute: '/',
    /** 侧栏折叠 */
    sidebarCollapsed: false,
    /** 顶栏是否显示版本号与简介（默认显示） */
    titleBarShowVersionAndTagline: true,
    /** 是否使用系统浏览器打开外部链接（默认使用系统浏览器） */
    useSystemBrowser: true,
  },
  /** 卡牌生成器状态 */
  cardGenerator: {
    previewVisible: true,
    autoRefresh: true,
    formData: normalizeCard({ ...DEFAULT_CARD }),
    /** 外部载入表单时递增，供生成器同步插图区等本地 UI */
    formLoadRevision: 0,
  },

  setCurrentCard: (card) => set({ currentCard: normalizeCard(card) }),

  resetCurrentCard: () => set({ currentCard: normalizeCard({ ...DEFAULT_CARD }) }),

  /**
   * 从卡牌浏览等外部载入：写入生成器 formData 与 currentCard（控件绑定 formData）。
   */
  loadCardIntoGenerator: (card) =>
    set((state) => {
      const data = normalizeCard(card)
      return {
        currentCard: data,
        cardGenerator: {
          ...state.cardGenerator,
          formData: data,
          autoRefresh: true,
          formLoadRevision: (state.cardGenerator.formLoadRevision ?? 0) + 1,
        },
      }
    }),

  addCard: (card) => {
    set((state) => ({
      cards: [...state.cards, { ...normalizeCard(card), id: Date.now().toString() }],
    }))
    schedulePersistDiyCards()
  },

  updateCard: (id, updatedCard) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === id ? { ...c, ...normalizeCard(updatedCard) } : c,
      ),
    }))
    schedulePersistDiyCards()
  },

  deleteCard: (id) => {
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    }))
    schedulePersistDiyCards()
  },

  setSetting: (key, value) => set((state) => ({
    settings: { ...state.settings, [key]: value },
  })),

  toggleFavoriteCardId: (id) =>
    set((state) => {
      const n = Number(id)
      if (!Number.isFinite(n)) return state
      const prev = state.settings.favoriteCardIds || []
      const has = prev.includes(n)
      const favoriteCardIds = has
        ? prev.filter((x) => x !== n)
        : [...prev, n]
      return { settings: { ...state.settings, favoriteCardIds } }
    }),

  hydrateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  loadCards: (cards) => set({ cards }),

  /** 设置卡牌生成器状态 */
  setCardGeneratorState: (state) => set((prev) => ({
    cardGenerator: { ...prev.cardGenerator, ...state },
  })),

  /** 重置卡牌生成器状态 */
  resetCardGeneratorState: () => set({
    cardGenerator: {
      previewVisible: true,
      autoRefresh: true,
      formData: normalizeCard({ ...DEFAULT_CARD }),
      formLoadRevision: 0,
    },
  }),
}))

export default useCardStore
