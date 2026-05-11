/** @param {Record<string, unknown>} card */
export function getCardImageUrl(card) {
  const images = card.card_images
  if (Array.isArray(images) && images[0]) {
    return (
      images[0].image_url_small ||
      images[0].image_url ||
      images[0].image_url_cropped ||
      ''
    )
  }
  const id = card.id
  if (id != null) {
    return `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`
  }
  return ''
}

/** 卡图原图 / 高清（详情页用） */
export function getCardImageUrlLarge(card) {
  const images = card.card_images
  if (Array.isArray(images) && images[0]) {
    return (
      images[0].image_url ||
      images[0].image_url_cropped ||
      images[0].image_url_small ||
      ''
    )
  }
  const id = card.id
  if (id != null) {
    return `https://images.ygoprodeck.com/images/cards/${id}.jpg`
  }
  return ''
}

/**
 * 是否属于额外卡组（融合 / 同调 / 超量 / 连接；灵摆怪兽仍在主卡组）
 * @param {Record<string, unknown>} card
 */
export function isExtraDeckCard(card) {
  const f = String(card.frameType || '').toLowerCase()
  return ['fusion', 'synchro', 'xyz', 'link'].includes(f)
}

/** 卡组持久化用精简字段（含卡图 URL） */
export function slimCardForDeck(card) {
  return {
    id: card.id,
    name: card.name,
    type: card.type,
    frameType: card.frameType,
    card_images: card.card_images,
  }
}

/** @param {Record<string, unknown>} card */
export function getCardSortKey(card) {
  const t = String(card.type || '')
  if (/monster/i.test(t)) return 0
  if (/spell/i.test(t)) return 1
  if (/trap/i.test(t)) return 2
  return 3
}
