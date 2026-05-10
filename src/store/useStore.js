import { create } from 'zustand'
import { DEFAULT_CARD } from '../config/cardConstants'

const useCardStore = create((set) => ({
  cards: [],
  currentCard: { ...DEFAULT_CARD },
  settings: {
    language: 'cn',
    theme: 'light',
    autoSave: true,
  },

  setCurrentCard: (card) => set({ currentCard: card }),
  resetCurrentCard: () => set({ currentCard: { ...DEFAULT_CARD } }),

  addCard: (card) => set((state) => ({
    cards: [...state.cards, { ...card, id: Date.now().toString() }]
  })),

  updateCard: (id, updatedCard) => set((state) => ({
    cards: state.cards.map(c => c.id === id ? { ...c, ...updatedCard } : c)
  })),

  deleteCard: (id) => set((state) => ({
    cards: state.cards.filter(c => c.id !== id)
  })),

  setSetting: (key, value) => set((state) => ({
    settings: { ...state.settings, [key]: value }
  })),

  loadCards: (cards) => set({ cards }),
}))

export default useCardStore
