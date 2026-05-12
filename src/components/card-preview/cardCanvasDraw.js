import {
  CARD_H,
  CARD_W,
  CARD_NAME_CHAR_HARD_CAP,
  CARD_NAME_MIN_SCALE_X,
  CARD_NAME_VISUAL_BUDGET,
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
  for (const char of text || '') {
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

/**
 * 按「M 宽」为 1 的视觉预算 + `maxWidth` 双约束截断卡名（中英数字自动按实际字宽计入）。
 * @param {CanvasRenderingContext2D} ctx 已设好 `font`
 * @param {string} trimmed 已 trim 的卡名
 * @param {number} maxWidthPx `z.name.maxWidth`
 * @param {number} visualBudget 见 `CARD_NAME_VISUAL_BUDGET`
 * @param {number} hardCap 见 `CARD_NAME_CHAR_HARD_CAP`
 */
function sliceNameByVisualBudget(ctx, trimmed, maxWidthPx, visualBudget, hardCap) {
  if (!trimmed) return '???'
  const refW = ctx.measureText('M').width || ctx.measureText('0').width || 1
  let out = ''
  let accUnits = 0
  const chars = [...trimmed].slice(0, hardCap)
  for (const ch of chars) {
    const next = out + ch
    if (ctx.measureText(next).width > maxWidthPx) break
    const chUnits = Math.max(0.35, ctx.measureText(ch).width / refW)
    if (out !== '' && accUnits + chUnits > visualBudget + 1e-6) break
    out = next
    accUnits += chUnits
  }
  if (out) return out
  return chars[0] || '?'
}

/**
 * 卡名在固定 `maxWidth` 下的绘制文案与水平缩放（避免逐字截断死循环与 O(n²) measureText）。
 * @param {CanvasRenderingContext2D} ctx 已设好 `font`
 * @param {string} rawName
 * @param {number} maxWidth 由版面 `z.name.maxWidth` 得到
 * @returns {{ drawText: string, scaleX: number }}
 */
export function fitCardNameForCanvas(ctx, rawName, maxWidth) {
  const trimmed = rawName && String(rawName).trim() ? String(rawName).trim() : ''
  const base = trimmed
    ? sliceNameByVisualBudget(
        ctx,
        trimmed,
        maxWidth,
        CARD_NAME_VISUAL_BUDGET,
        CARD_NAME_CHAR_HARD_CAP,
      )
    : '???'
  if (maxWidth <= 1) {
    return { drawText: base.slice(0, 1) || '?', scaleX: 1 }
  }

  const fullW = ctx.measureText(base).width
  if (fullW <= maxWidth) {
    return { drawText: base, scaleX: 1 }
  }

  const scale = maxWidth / fullW
  if (scale >= CARD_NAME_MIN_SCALE_X) {
    return { drawText: base, scaleX: scale }
  }

  const ell = NAME_ELLIPSIS
  const ellW = ctx.measureText(ell).width
  if (ellW >= maxWidth) {
    return { drawText: ell, scaleX: 1 }
  }

  let lo = 0
  let hi = base.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const cand = base.slice(0, mid) + ell
    if (ctx.measureText(cand).width <= maxWidth) lo = mid
    else hi = mid - 1
  }
  const drawText = lo === 0 ? ell : base.slice(0, lo) + ell
  return { drawText, scaleX: 1 }
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
  const { name: fontName, desc: fontDesc } = getMoldFontStacks()
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

  /** 卡名：与 ygo-card common.js name.fontSize ≈ 65（813 基准）；宽度上限为 `z.name.maxWidth` */
  const nameStr = (card.name || '???').trim() || '???'
  ctx.font = `bold ${Math.round(65 * z.r)}px ${fontName}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const { drawText: drawName, scaleX: nameScaleX } = fitCardNameForCanvas(
    ctx,
    nameStr,
    z.name.maxWidth,
  )
  ctx.save()
  if (nameScaleX !== 1) {
    ctx.translate(z.name.x, z.name.y)
    ctx.scale(nameScaleX, 1)
    ctx.translate(-z.name.x, -z.name.y)
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = nameScaleX < 1 ? (3 * z.r) / Math.max(nameScaleX, 0.2) : 3 * z.r
  ctx.strokeText(drawName, z.name.x, z.name.y)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillText(drawName, z.name.x, z.name.y)
  ctx.restore()

  if (cardType === 'monster' && !z.isLink && Number(card.level) > 0) {
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
      fontName,
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
      ctx.font = `${Math.round(26 * z.r)}px ${fontName}`
      const race = hasRace ? (card.race.replace(/族$/, '') + '族') : ''
      const catLabel = hasCat ? labelFromOptions(MONSTER_CATEGORIES, card.monsterCategory) : ''
      typeText = `「${race}${hasRace && hasCat ? '／' : ''}${catLabel}」`
      ctx.textAlign = 'left'
      ctx.fillText(typeText, z.raceLine.x, z.raceLine.y)
    }
  } else if (cardType === 'spell') {
    const hasSpellType = card.spellType && card.spellType.trim()
    if (hasSpellType) {
      ctx.font = `${Math.round(48 * z.r)}px ${fontName}`
      typeText = `「${labelFromOptions(SPELL_CARD_TYPES, card.spellType)}」`
      ctx.textAlign = 'right'
      ctx.fillText(typeText, z.spellTypeLine.x, z.spellTypeLine.y)
    }
  } else {
    const hasTrapType = card.trapType && card.trapType.trim()
    if (hasTrapType) {
      ctx.font = `${Math.round(48 * z.r)}px ${fontName}`
      typeText = `「${labelFromOptions(TRAP_CARD_TYPES, card.trapType)}」`
      ctx.textAlign = 'right'
      ctx.fillText(typeText, z.spellTypeLine.x, z.spellTypeLine.y)
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

  ctx.fillStyle = '#111'
  ctx.font = `${Math.round(24 * z.r)}px ${fontDesc}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  if (isPendulum && pendBlock) {
    const mainLines = wrapTextLines(ctx, mainDesc, z.monsterDesc.maxWidth)
    let ty = z.monsterDesc.y
    const lh = z.monsterDesc.lineHeight
    const maxMain = z.monsterDesc.maxLines
    mainLines.slice(0, maxMain).forEach((line) => {
      ctx.fillText(line, z.monsterDesc.x, ty)
      ty += lh
    })
    ctx.font = `${Math.round(22 * z.r)}px ${fontDesc}`
    const pendLines = wrapTextLines(ctx, pendBlock, z.pendDesc.maxWidth)
    let py = z.pendDesc.y
    const plh = z.pendDesc.lineHeight
    pendLines.slice(0, z.pendDesc.maxLines).forEach((line) => {
      ctx.fillText(line, z.pendDesc.x, py)
      py += plh
    })
  } else if (cardType === 'monster') {
    const lines = wrapTextLines(ctx, mainDesc, z.monsterDesc.maxWidth)
    let ty = z.monsterDesc.y
    const lh = z.monsterDesc.lineHeight
    lines.slice(0, z.monsterDesc.maxLines).forEach((line) => {
      ctx.fillText(line, z.monsterDesc.x, ty)
      ty += lh
    })
  } else {
    const lines = wrapTextLines(ctx, bodyText, z.spellDesc.maxWidth)
    let ty = z.spellDesc.y
    const lh = z.spellDesc.lineHeight
    lines.slice(0, z.spellDesc.maxLines).forEach((line) => {
      ctx.fillText(line, z.spellDesc.x, ty)
      ty += lh
    })
  }

  if (cardType === 'monster') {
    const atkInfinite = Boolean(card.attackInfinite)
    const defInfinite = Boolean(card.defenseInfinite)
    const hasAtk = atkInfinite || Number(card.attack) > 0
    const hasDef = defInfinite || Number(card.defense) > 0

    if (hasAtk || hasDef) {
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2 * z.r
      ctx.beginPath()
      ctx.moveTo(z.lineUnderStats.x, z.lineUnderStats.y)
      ctx.lineTo(z.lineUnderStats.x + z.lineUnderStats.w, z.lineUnderStats.y)
      ctx.stroke()

      ctx.font = `bold ${Math.round(36 * z.r)}px ${fontName}`
      ctx.textBaseline = 'middle'

      if (hasAtk) {
        const atkStr = atkInfinite ? '\u221e' : `${Math.min(9999, Math.max(0, Number(card.attack) || 0))}`
        ctx.textAlign = 'right'
        ctx.fillStyle = pwdLight ? '#ffffff' : '#111'
        ctx.fillText(atkStr, z.atk.x, z.atk.y, z.atk.maxWidth)
        ctx.textAlign = 'left'
        ctx.fillText('ATK/', z.atk.labelX, z.atk.labelY)
      }

      if (z.isLink) {
        const linkNum =
          Number(card.linkRating) > 0
            ? Number(card.linkRating)
            : Math.min(8, Number(card.level) || 1)
        ctx.textAlign = 'right'
        ctx.fillStyle = pwdLight ? '#ffffff' : '#111'
        ctx.fillText(`${linkNum}`, z.linkDef.x, z.linkDef.y, z.linkDef.maxWidth)
        ctx.textAlign = 'left'
        ctx.fillText('LINK-', z.linkDef.linkLabelX, z.linkDef.linkLabelY)
      } else if (hasDef) {
        const defStr = defInfinite ? '\u221e' : `${Math.min(9999, Math.max(0, Number(card.defense) || 0))}`
        ctx.textAlign = 'right'
        ctx.fillStyle = pwdLight ? '#ffffff' : '#111'
        ctx.fillText(defStr, z.def.x, z.def.y, z.def.maxWidth)
        ctx.textAlign = 'left'
        ctx.fillText('DEF/', z.def.labelX, z.def.labelY)
      }
    }
  }

  const pwd = String(card.password || '').replace(/\D/g, '').slice(0, 8)
  if (pwd && pwd.length > 0) {
    ctx.font = `${Math.round(23 * z.r)}px ${fontDesc}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = pwdLight ? '#ffffff' : '#6b7280'
    ctx.fillText(pwd.padStart(8, '0'), z.password.x, z.password.y)

    ctx.fillStyle = pwdLight ? '#e5e7eb' : '#6b7280'
    ctx.font = `${Math.round(18 * z.r)}px ${fontDesc}`
    ctx.textAlign = 'right'
    ctx.fillText('© KONAMI', z.copyright.x, z.copyright.y)
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
