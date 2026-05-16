import {
  CARD_H,
  CARD_W,
  CARD_NAME_MIN_SCALE_X,
  FRAME_THEME,
  getYgoLayoutZones,
} from '../../config/cardLayout'
import {
  labelFromOptions,
  MONSTER_CATEGORIES,
  SPELL_CARD_TYPES,
  TRAP_CARD_TYPES,
} from '../../config/cardConstants'
import { getMoldFontStacks } from '../../config/moldFonts'

/**
 * 按字符折行（中日文无空格）
 * @param {CanvasRenderingContext2D} ctx
 */
export function wrapTextLines(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (const char of [...(text || '')]) {
    const next = line + char
    if (ctx.measureText(next).width > maxWidth && line !== '') {
      lines.push(line)
      line = char
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

const NAME_ELLIPSIS = '\u2026'

/** 效果正文：在窄画布上设上下限，避免过小不可读或过大溢出（ygo-card 模板为 24px@813） */
const DESC_BODY_MIN_PX = 11
const DESC_BODY_MAX_PX = 14

/** 灵摆区正文（模板 lbFontSize 22） */
const DESC_PEND_MIN_PX = 10
const DESC_PEND_MAX_PX = 12.5

/** 种族/类别行（模板 race 26，略放大作「标题」） */
function canvasRaceTitlePx(r) {
  return Math.min(19, Math.max(14, Math.round(30 * r)))
}

/** 魔陷类型行（cnWebConfig type 44～46，common 48） */
function canvasSpellTypeTitlePx(r) {
  return Math.min(24, Math.max(18, Math.round(46 * r)))
}

function resolveDescBodyPx(r) {
  return Math.min(DESC_BODY_MAX_PX, Math.max(DESC_BODY_MIN_PX, Math.round(24 * r * 1.2)))
}

function resolveDescPendPx(r) {
  return Math.min(DESC_PEND_MAX_PX, Math.max(DESC_PEND_MIN_PX, Math.round(22 * r * 1.1)))
}

/**
 * 效果正文：按 maxWidth 逐段 `wrapTextLines` 自动换行；仍超 maxLines 时略缩小字号。
 * @returns {{ lines: string[], drawFontPx: number }}
 */
function buildDescLinesForCanvas(ctx, desc, baseFontPx, fontStack, maxLines, maxWidth, minPx = DESC_BODY_MIN_PX) {
  const trimmed = desc && String(desc).trim() ? String(desc).trim() : ''
  if (!trimmed) {
    return { lines: [], drawFontPx: baseFontPx }
  }

  const collectLines = (fontPx) => {
    ctx.font = `${fontPx}px ${fontStack}`
    const blocks = trimmed.split('\n')
    const acc = []
    for (const block of blocks) {
      const b = block.replace(/\r/g, '')
      if (!b.trim()) {
        continue
      }
      acc.push(...wrapTextLines(ctx, b, maxWidth))
    }
    return acc
  }

  let drawFontPx = baseFontPx
  let lines = collectLines(drawFontPx)
  while (lines.length > maxLines && drawFontPx > minPx + 0.25) {
    drawFontPx = Math.max(minPx, Math.round((drawFontPx - 0.5) * 10) / 10)
    lines = collectLines(drawFontPx)
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
  }
  return { lines, drawFontPx }
}

/**
 * 在裁剪区内绘制描述行；末行使用 `maxWidth` 参数做横向压缩（对齐 ygo-card drawDesc）。
 */
function drawDescLinesClipped(ctx, lines, x, y0, lineH, maxW, maxLines, fontPx, fontStack, fillStyle) {
  const lim = Math.min(lines.length, maxLines)
  if (lim <= 0) {
    return
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(x - 1, y0 - 1, maxW + 2, maxLines * lineH + 2)
  ctx.clip()
  ctx.font = `${fontPx}px ${fontStack}`
  ctx.fillStyle = fillStyle
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  for (let i = 0; i < lim; i++) {
    const ty = y0 + i * lineH
    ctx.fillText(lines[i], x, ty, maxW)
  }
  ctx.restore()
}

const NAME_DRAW_HARD_CAP = 96

/**
 * 卡名：整串测量 → 优先整体水平缩放；仍超出则用下限缩放 + 截断省略号（动态压缩量）。
 * @param {CanvasRenderingContext2D} ctx 已设好 `font`
 * @param {string} rawName
 * @param {number} maxWidth
 * @returns {{ drawText: string, scaleX: number }}
 */
export function fitCardNameForCanvas(ctx, rawName, maxWidth) {
  const trimmed = rawName && String(rawName).trim() ? String(rawName).trim() : ''
  if (!trimmed) {
    return { drawText: '', scaleX: 1 }
  }
  if (maxWidth <= 1) {
    return { drawText: [...trimmed][0] || '', scaleX: 1 }
  }

  const chars = [...trimmed].slice(0, NAME_DRAW_HARD_CAP)
  const text = chars.join('')
  const fullW = ctx.measureText(text).width
  if (fullW <= 0) {
    return { drawText: chars[0] || '', scaleX: 1 }
  }

  const minScale = CARD_NAME_MIN_SCALE_X

  if (fullW <= maxWidth) {
    return { drawText: text, scaleX: 1 }
  }

  const scaleUniform = maxWidth / fullW
  if (scaleUniform >= minScale) {
    return { drawText: text, scaleX: scaleUniform }
  }

  const ell = NAME_ELLIPSIS
  /** 使用最小水平缩放时，测量宽度不得超过该值 */
  const budget = maxWidth / minScale

  let lo = 0
  let hi = text.length
  let bestLen = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const pre = chars.slice(0, mid).join('')
    const needEll = mid < text.length
    const cand = needEll ? pre + ell : pre
    const cw = ctx.measureText(cand).width
    if (cw <= budget + 1e-6) {
      bestLen = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  let drawText =
    bestLen >= text.length ? text : `${chars.slice(0, bestLen).join('')}${bestLen < text.length ? ell : ''}`

  if (ctx.measureText(drawText).width <= 0) {
    drawText = chars[0] || '?'
  }

  const wFinal = ctx.measureText(drawText).width
  const scaleX = Math.max(minScale, Math.min(1, maxWidth / Math.max(wFinal, 1)))
  return { drawText, scaleX }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR, fillStyle) {
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes
  ctx.beginPath()
  ctx.moveTo(cx, cy - outerR)
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
    rot += step
  }
  ctx.lineTo(cx, cy - outerR)
  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
}

/** 等级星：优先 Mold/Star 位图；缺失时回退矢量星。坐标对齐 ygo-card common.js level */
function drawLevelStarsYgo(ctx, level, z, starImg) {
  const n = Math.min(12, Math.max(0, Number(level) || 0))
  if (n <= 0) return
  const { levelRef, r, isXyz } = z
  const size = levelRef.starSize
  const half = size / 2
  const baseY = 145 * r + half
  const refW = 813
  const dist = 55 * r
  const outer = Math.max(4, 9 * r)
  const inner = outer * 0.45

  const imgOk =
    starImg && starImg.complete && starImg.naturalWidth && starImg.naturalHeight

  for (let i = 0; i < n; i++) {
    let leftX
    if (isXyz) {
      leftX = (refW - 50 - 686 + 55 * i) * r
    } else {
      leftX = 686 * r - dist * i
    }

    if (imgOk) {
      const iw = starImg.naturalWidth
      const ih = starImg.naturalHeight
      const scale = Math.min(size / iw, size / ih)
      const dw = iw * scale
      const dh = ih * scale
      ctx.drawImage(starImg, leftX + (size - dw) / 2, baseY - dh / 2, dw, dh)
      continue
    }

    const cx = leftX + half
    const cy = baseY
    drawStar(ctx, cx, cy, 5, outer, inner, '#b45309')
    drawStar(ctx, cx, cy, 5, outer * 0.92, inner * 0.88, '#d97706')
  }
}

function drawRoundedRect(ctx, x, y, w, h, rad) {
  const radius = Math.min(rad, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawPlaceholderFrame(ctx, w, h, theme) {
  ctx.fillStyle = '#0a0a0a'
  drawRoundedRect(ctx, 0, 0, w, h, 10)
  ctx.fill()
  ctx.fillStyle = theme.outer
  drawRoundedRect(ctx, 2, 2, w - 4, h - 4, 8)
  ctx.fill()
  ctx.fillStyle = theme.inner
  drawRoundedRect(ctx, 5, 5, w - 10, h - 10, 6)
  ctx.fill()
  ctx.fillStyle = theme.face
  drawRoundedRect(ctx, 8, 8, w - 16, h - 16, 4)
  ctx.fill()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Record<string, unknown>} card 已由 normalizeCard 规整的卡数据
 * @param {{ frameImg?: HTMLImageElement | null, attrImg?: HTMLImageElement | null, artImg?: HTMLImageElement | null, starIconImg?: HTMLImageElement | null }} assets
 */
export function paintCard(ctx, card, assets = {}) {
  const { name: fontNumber, desc: fontDesc, cnTitle: fontCnTitle, statsCn: fontStatsCn } =
    getMoldFontStacks()
  const w = CARD_W
  const h = CARD_H
  const z = getYgoLayoutZones(card, w, h)
  const cardType = card.cardType || 'monster'
  const theme = FRAME_THEME[cardType] || FRAME_THEME.monster
  /** 超量非灵摆：卡密与 © 等使用浅色字（对齐常见模板对比） */
  const pwdLight = cardType === 'monster' && z.isXyz && !z.isPendulum
  const hasFrame =
    assets.frameImg && assets.frameImg.complete && assets.frameImg.naturalWidth

  ctx.save()
  ctx.clearRect(0, 0, w, h)

  if (hasFrame) {
    ctx.drawImage(assets.frameImg, 0, 0, w, h)
  } else {
    drawPlaceholderFrame(ctx, w, h, theme)
  }

  const pic = z.pic

  /** 卡名：对齐 ygo-card common.js name.fontSize 65 */
  const nameTrimmed = String(card.name || '').trim()
  if (nameTrimmed) {
    ctx.font = `bold ${Math.round(65 * z.r)}px ${fontCnTitle}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    const { drawText: drawName, scaleX: nameScaleX } = fitCardNameForCanvas(
      ctx,
      nameTrimmed,
      z.name.maxWidth,
    )
    ctx.save()
    if (nameScaleX !== 1) {
      ctx.translate(z.name.x, z.name.y)
      ctx.scale(nameScaleX, 1)
      ctx.translate(-z.name.x, -z.name.y)
    }
    ctx.fillStyle = '#1a1a1a'
    if (nameScaleX === 1) {
      ctx.fillText(drawName, z.name.x, z.name.y, z.name.maxWidth)
    } else {
      ctx.fillText(drawName, z.name.x, z.name.y)
    }
    ctx.restore()
  }

  if (cardType === 'monster' && !z.isLink && card.level != null && Number(card.level) > 0) {
    drawLevelStarsYgo(ctx, card.level, z, assets.starIconImg)
  }

  const attrR = z.attrR
  const hasAttribute = card.attribute && card.attribute.trim()
  if (hasAttribute && assets.attrImg && assets.attrImg.complete && assets.attrImg.naturalWidth) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(z.attrCx, z.attrCy, attrR, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(
      assets.attrImg,
      z.attrCx - attrR,
      z.attrCy - attrR,
      attrR * 2,
      attrR * 2,
    )
    ctx.restore()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 1 * z.r
    ctx.beginPath()
    ctx.arc(z.attrCx, z.attrCy, attrR, 0, Math.PI * 2)
    ctx.stroke()
  } else if (hasAttribute) {
    drawAttributeFallback(
      ctx,
      cardType,
      card.attribute,
      z.attrCx,
      z.attrCy,
      attrR,
      fontNumber,
      z.r,
    )
  }

  ctx.fillStyle = theme.artMat
  ctx.fillRect(pic.x, pic.y, pic.w, pic.h)
  if (!hasFrame) {
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(pic.x + 0.5, pic.y + 0.5, pic.w - 1, pic.h - 1)
  }

  if (assets.artImg && assets.artImg.complete && assets.artImg.naturalWidth) {
    const iw = assets.artImg.naturalWidth
    const ih = assets.artImg.naturalHeight
    const innerPad = 3 * z.r
    const boxW = pic.w - innerPad * 2
    const boxH = pic.h - innerPad * 2
    const scale = Math.min(boxW / iw, boxH / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = pic.x + innerPad + (boxW - dw) / 2
    const dy = pic.y + innerPad + (boxH - dh) / 2
    ctx.drawImage(assets.artImg, dx, dy, dw, dh)
  }

  ctx.fillStyle = '#1a1a1a'
  ctx.textBaseline = 'middle'
  let typeText = ''
  if (cardType === 'monster') {
    const hasRace = card.race && card.race.trim()
    const hasCat = card.monsterCategory && card.monsterCategory.trim()
    if (hasRace || hasCat) {
      ctx.font = `${canvasRaceTitlePx(z.r)}px ${fontCnTitle}`
      const race = hasRace ? (card.race.replace(/族$/, '') + '族') : ''
      const catLabel = hasCat ? labelFromOptions(MONSTER_CATEGORIES, card.monsterCategory) : ''
      typeText = `[${race}${hasRace && hasCat ? '/' : ''}${catLabel}]`
      ctx.textAlign = 'left'
      ctx.fillText(typeText, z.raceLine.x, z.raceLine.y, z.raceLine.maxWidth)
    }
  } else if (cardType === 'spell') {
    const hasSpellType = card.spellType && card.spellType.trim()
    if (hasSpellType) {
      ctx.font = `${canvasSpellTypeTitlePx(z.r)}px ${fontCnTitle}`
      typeText = `[${labelFromOptions(SPELL_CARD_TYPES, card.spellType)}]`
      ctx.textAlign = 'left'
      ctx.fillText(
        typeText,
        z.spellTypeLine.x,
        z.spellTypeLine.y,
        z.spellTypeLine.maxWidth,
      )
    }
  } else {
    const hasTrapType = card.trapType && card.trapType.trim()
    if (hasTrapType) {
      ctx.font = `${canvasSpellTypeTitlePx(z.r)}px ${fontCnTitle}`
      typeText = `[${labelFromOptions(TRAP_CARD_TYPES, card.trapType)}]`
      ctx.textAlign = 'left'
      ctx.fillText(
        typeText,
        z.spellTypeLine.x,
        z.spellTypeLine.y,
        z.spellTypeLine.maxWidth,
      )
    }
  }

  const bodyText = card.effect || card.description || ''
  const isPendulum = z.isPendulum
  let mainDesc = bodyText
  let pendBlock = ''
  if (isPendulum) {
    const parts = bodyText.split(/\n{2,}/)
    if (parts.length >= 2) {
      mainDesc = parts[0].trim()
      pendBlock = parts.slice(1).join('\n\n').trim()
    }
  }

  const bodyPx = resolveDescBodyPx(z.r)
  const pendPx = resolveDescPendPx(z.r)
  /** ygo-card common.js：monsterDesc.lineHeight 26，spellDesc 24，lbLineHeight 24.5 */
  const lhMonster = 26 * z.r
  const lhSpell = 24 * z.r
  const lhPend = 24.5 * z.r
  const descFill = '#111'

  if (isPendulum && pendBlock) {
    const { lines: mainLines, drawFontPx: mainDrawPx } = buildDescLinesForCanvas(
      ctx,
      mainDesc,
      bodyPx,
      fontDesc,
      z.monsterDesc.maxLines,
      z.monsterDesc.maxWidth,
    )
    drawDescLinesClipped(
      ctx,
      mainLines,
      z.monsterDesc.x,
      z.monsterDesc.y,
      lhMonster,
      z.monsterDesc.maxWidth,
      z.monsterDesc.maxLines,
      mainDrawPx,
      fontDesc,
      descFill,
    )
    const { lines: pendLines, drawFontPx: pendDrawPx } = buildDescLinesForCanvas(
      ctx,
      pendBlock,
      pendPx,
      fontDesc,
      z.pendDesc.maxLines,
      z.pendDesc.maxWidth,
      DESC_PEND_MIN_PX,
    )
    drawDescLinesClipped(
      ctx,
      pendLines,
      z.pendDesc.x,
      z.pendDesc.y,
      lhPend,
      z.pendDesc.maxWidth,
      z.pendDesc.maxLines,
      pendDrawPx,
      fontDesc,
      descFill,
    )
  } else if (isPendulum && mainDesc.trim()) {
    const { lines: mainLines, drawFontPx: mainDrawPx } = buildDescLinesForCanvas(
      ctx,
      mainDesc,
      bodyPx,
      fontDesc,
      z.monsterDesc.maxLines,
      z.monsterDesc.maxWidth,
    )
    drawDescLinesClipped(
      ctx,
      mainLines,
      z.monsterDesc.x,
      z.monsterDesc.y,
      lhMonster,
      z.monsterDesc.maxWidth,
      z.monsterDesc.maxLines,
      mainDrawPx,
      fontDesc,
      descFill,
    )
  } else if (cardType === 'monster' && mainDesc.trim()) {
    const { lines, drawFontPx } = buildDescLinesForCanvas(
      ctx,
      mainDesc,
      bodyPx,
      fontDesc,
      z.monsterDesc.maxLines,
      z.monsterDesc.maxWidth,
    )
    drawDescLinesClipped(
      ctx,
      lines,
      z.monsterDesc.x,
      z.monsterDesc.y,
      lhMonster,
      z.monsterDesc.maxWidth,
      z.monsterDesc.maxLines,
      drawFontPx,
      fontDesc,
      descFill,
    )
  } else if (cardType !== 'monster' && bodyText.trim()) {
    const { lines, drawFontPx } = buildDescLinesForCanvas(
      ctx,
      bodyText,
      bodyPx,
      fontDesc,
      z.spellDesc.maxLines,
      z.spellDesc.maxWidth,
    )
    drawDescLinesClipped(
      ctx,
      lines,
      z.spellDesc.x,
      z.spellDesc.y,
      lhSpell,
      z.spellDesc.maxWidth,
      z.spellDesc.maxLines,
      drawFontPx,
      fontDesc,
      descFill,
    )
  }

  if (cardType === 'monster') {
    const atkInfinite = Boolean(card.attackInfinite)
    const defInfinite = Boolean(card.defenseInfinite)
    const atkVal = card.attack
    const defVal = card.defense
    const hasAtkNum = atkVal != null && Number.isFinite(Number(atkVal))
    const hasDefNum = defVal != null && Number.isFinite(Number(defVal))
    const hasAtk = atkInfinite || hasAtkNum
    const hasDef = defInfinite || hasDefNum
    const hasLinkRow = z.isLink && Number(card.linkRating) > 0

    if (hasAtk || hasDef || hasLinkRow) {
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2 * z.r
      ctx.beginPath()
      ctx.moveTo(z.lineUnderStats.x, z.lineUnderStats.y)
      ctx.lineTo(z.lineUnderStats.x + z.lineUnderStats.w, z.lineUnderStats.y)
      ctx.stroke()

      const labelFontPx = Math.round(34 * z.r)
      const numFontPx = Math.round(36 * z.r)
      const cnStatFontPx = Math.round(32 * z.r)
      const linkLabelPx = Math.round(30 * z.r)

      if (hasAtk) {
        const atkStr = atkInfinite
          ? '\u7121\u9650\u5927'
          : `${Math.min(9999, Math.max(0, Number(card.attack) || 0))}`
        const atkLabelX = atkInfinite ? z.atk.labelX - 10 * z.r : z.atk.labelX
        const atkValueX = atkInfinite ? z.atk.x + 10 * z.r : z.atk.x
        ctx.textAlign = 'left'
        ctx.fillStyle = pwdLight ? '#ffffff' : '#111'
        ctx.font = `${labelFontPx}px ${fontStatsCn}`
        ctx.fillText('攻/', atkLabelX, z.atk.labelY)
        ctx.textAlign = 'right'
        ctx.font = atkInfinite
          ? `${cnStatFontPx}px ${fontStatsCn}`
          : `${numFontPx}px ${fontNumber}`
        ctx.fillText(atkStr, atkValueX, z.atk.y)
      }

      if (z.isLink) {
        if (hasLinkRow) {
          const linkNum =
            Number(card.linkRating) > 0
              ? Number(card.linkRating)
              : Math.min(8, Number(card.level) || 1)
          ctx.textAlign = 'left'
          ctx.fillStyle = pwdLight ? '#ffffff' : '#111'
          ctx.font = `${linkLabelPx}px ${fontStatsCn}`
          ctx.fillText('连/', z.linkDef.linkLabelX, z.linkDef.linkLabelY)
          ctx.font = `${numFontPx}px ${fontNumber}`
          ctx.textAlign = 'right'
          ctx.fillText(`${linkNum}`, z.linkDef.x, z.linkDef.y)
        }
      } else if (hasDef) {
        const defStr = defInfinite
          ? '\u7121\u9650\u5927'
          : `${Math.min(9999, Math.max(0, Number(card.defense) || 0))}`
        const defLabelX = defInfinite ? z.def.labelX - 10 * z.r : z.def.labelX
        const defValueX = defInfinite ? z.def.x + 10 * z.r : z.def.x
        ctx.textAlign = 'left'
        ctx.fillStyle = pwdLight ? '#ffffff' : '#111'
        ctx.font = `${labelFontPx}px ${fontStatsCn}`
        ctx.fillText('防/', defLabelX, z.def.labelY)
        ctx.textAlign = 'right'
        ctx.font = defInfinite
          ? `${cnStatFontPx}px ${fontStatsCn}`
          : `${numFontPx}px ${fontNumber}`
        ctx.fillText(defStr, defValueX, z.def.y)
      }
    }
  }

  ctx.font = `${Math.round(18 * z.r)}px ${fontDesc}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = pwdLight ? '#e5e7eb' : '#6b7280'
  ctx.fillText('© KONAMI', z.copyright.x, z.copyright.y)

  const pwd = String(card.password || '').replace(/\D/g, '').slice(0, 8)
  if (pwd && pwd.length > 0) {
    ctx.font = `${Math.round(23 * z.r)}px ${fontDesc}`
    ctx.textAlign = 'left'
    ctx.fillStyle = pwdLight ? '#ffffff' : '#6b7280'
    ctx.fillText(pwd.padStart(8, '0'), z.password.x, z.password.y)
  }

  ctx.restore()
}

function drawAttributeFallback(ctx, cardType, attribute, cx, cy, r, fontNameStack, scaleR = 1) {
  const ATTR_SHORT = {
    dark: '暗',
    divine: '神',
    earth: '地',
    fire: '炎',
    light: '光',
    water: '水',
    wind: '风',
  }
  let label = ATTR_SHORT[attribute] || '?'
  let bg = '#555'
  if (cardType === 'spell') {
    label = '魔'
    bg = '#15803d'
  } else if (cardType === 'trap') {
    label = '陷'
    bg = '#86198f'
  } else {
    const colors = {
      dark: '#6b21a8',
      divine: '#ca8a04',
      earth: '#92400e',
      fire: '#dc2626',
      light: '#eab308',
      water: '#2563eb',
      wind: '#16a34a',
    }
    bg = colors[attribute] || '#555'
  }

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = `bold ${Math.max(12, Math.round(26 * scaleR))}px ${fontNameStack}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, cy)
}
