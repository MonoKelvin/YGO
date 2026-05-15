import { create } from 'zustand'
import { DEFAULT_CARD, normalizeCard } from '../config/cardConstants'
import { DEFAULT_LIBRARY_PAGE_SIZE } from '../config/librarySettings'

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
  },

  setCurrentCard: (card) => set({ currentCard: normalizeCard(card) }),

  resetCurrentCard: () => set({ currentCard: normalizeCard({ ...DEFAULT_CARD }) }),

  addCard: (card) => set((state) => ({
    cards: [...state.cards, { ...normalizeCard(card), id: Date.now().toString() }],
  })),

  updateCard: (id, updatedCard) => set((state) => ({
    cards: state.cards.map((c) =>
      c.id === id ? { ...c, ...normalizeCard(updatedCard) } : c,
    ),
  })),

  deleteCard: (id) => set((state) => ({
    cards: state.cards.filter((c) => c.id !== id),
  })),

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
    },
  }),
}))

export default useCardStore
