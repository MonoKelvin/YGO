import {
  labelFromOptions,
  MONSTER_CATEGORIES,
  SPELL_CARD_TYPES,
  TRAP_CARD_TYPES,
} from '../../config/cardConstants'

/**
 * 列表卡片副标题（种族 / 魔法·陷阱类型）
 * @param {Record<string, unknown>} card
 */
export function getCardBrowserSubtitle(card) {
  if (card.cardType === 'monster') {
    const race = card.race || '怪兽'
    const cat = card.monsterCategory
      ? labelFromOptions(MONSTER_CATEGORIES, card.monsterCategory)
      : ''
    return cat ? `${race} · ${cat}` : race
  }
  if (card.cardType === 'spell') {
    return labelFromOptions(SPELL_CARD_TYPES, card.spellType)
  }
  return labelFromOptions(TRAP_CARD_TYPES, card.trapType)
}

/**
 * 列表卡片第三行（攻防 / 连接等）
 * @param {Record<string, unknown>} card
 */
export function getCardBrowserStatsLine(card) {
  if (card.cardType === 'monster') {
    if (card.monsterCategory === 'link') {
      return `连接 ${card.linkRating ?? card.level ?? '—'} · 攻 ${card.attack == null ? '—' : card.attack}`
    }
    return `攻 ${card.attack == null ? '—' : card.attack} / 守 ${card.defense == null ? '—' : card.defense}`
  }
  if (card.cardType === 'spell') {
    return '魔法卡'
  }
  return '陷阱卡'
}

/** 是否有可在资源管理器中打开的图片路径 */
export function cardHasRevealableImage(card) {
  const disp = String(card?.imageDisplayPath || '').trim()
  const img = String(card?.imagePath || '').trim()
  if (!disp && !img) {
    return false
  }
  if (disp.startsWith('data:') || img.startsWith('data:')) {
    return false
  }
  return true
}
