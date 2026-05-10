import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCardsStore = defineStore('cards', () => {
  const cards = ref([])
  const recentCards = ref([])
  const currentCard = ref(createEmptyCard())

  function createEmptyCard() {
    return {
      id: '',
      name: '',
      type: 'monster',
      type2: 'effect',
      type3: '',
      type4: '',
      attribute: 'dark',
      level: 4,
      pendulumScale: 0,
      race: '',
      desc: '',
      pendulumDesc: '',
      attack: 0,
      defense: 0,
      cardbag: '',
      password: '',
      copyright: '',
      linkMarkers: [false, false, false, false, false, false, false, false],
      customImagePath: null,
      customImageData: null,
      holoEffect: true
    }
  }

  async function loadCards() {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.readCards()
        if (result.success) {
          cards.value = result.data || []
        }
      }
    } catch (error) {
      console.error('Failed to load cards:', error)
    }
  }

  async function saveCards() {
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveCards(cards.value)
      }
    } catch (error) {
      console.error('Failed to save cards:', error)
    }
  }

  function addCard(card) {
    const newCard = { ...card, id: Date.now().toString() }
    cards.value.unshift(newCard)
    saveCards()
    return newCard
  }

  function updateCard(id, card) {
    const index = cards.value.findIndex(c => c.id === id)
    if (index !== -1) {
      cards.value[index] = { ...card, id }
      saveCards()
    }
  }

  function deleteCard(id) {
    const index = cards.value.findIndex(c => c.id === id)
    if (index !== -1) {
      cards.value.splice(index, 1)
      saveCards()
    }
  }

  function addToRecent(card) {
    const existing = recentCards.value.findIndex(c => c.id === card.id)
    if (existing !== -1) {
      recentCards.value.splice(existing, 1)
    }
    recentCards.value.unshift({ ...card })
    if (recentCards.value.length > 10) {
      recentCards.value.pop()
    }
  }

  function loadCardForEditing(card) {
    currentCard.value = { ...card }
  }

  function resetCurrentCard() {
    currentCard.value = createEmptyCard()
  }

  function getCardById(id) {
    return cards.value.find(c => c.id === id)
  }

  return {
    cards,
    recentCards,
    currentCard,
    loadCards,
    saveCards,
    addCard,
    updateCard,
    deleteCard,
    addToRecent,
    loadCardForEditing,
    resetCurrentCard,
    getCardById,
    createEmptyCard
  }
})
