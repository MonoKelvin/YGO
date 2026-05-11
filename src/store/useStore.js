import { create } from 'zustand'
import { DEFAULT_CARD, normalizeCard } from '../config/cardConstants'

const useCardStore = create((set) => ({
  cards: [],
  currentCard: normalizeCard({ ...DEFAULT_CARD }),
  settings: {
    language: 'cn',
    /** 默认跟随系统明暗（与设置页「跟随系统」一致） */
    theme: 'system',
    autoSave: true,
    /** 卡牌数据库在线分页条数 */
    libraryPageSize: 20,
    /** 收藏的官方卡牌 id（YGOProDeck） */
    favoriteCardIds: [],
    /** 上次路由（含 query），下次启动恢复 */
    lastRoute: '/',
    /** 侧栏折叠 */
    sidebarCollapsed: false,
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
}))

export default useCardStore
