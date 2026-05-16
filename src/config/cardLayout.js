/**
 * 基于 ygo-card 模板的 813×1185 参考坐标，按宽度等比缩放到预览画布（与 cardDrawer 使用 moldSize[0] 做 r 一致）。
 * @see https://github.com/yamiyang/ygo-card/blob/master/source/config/common.js
 */
export const YGO_MOLD_REF = { w: 813, h: 1185 }

/**
 * 卡名「视觉宽度」预算：以当前字体下拉丁大写 `M` 的 `measureText` 宽度为 1 单位，
 * 逐字累计 `measureText(字符)/M` 之和不超过该值（全英文约 16 字，纯中文约 8～10 字，中英混合自动介于其间）。
 */
export const CARD_NAME_VISUAL_BUDGET = 16

/**
 * 卡名输入/遍历的硬字符上限（防止恶意超长粘贴拖慢；应略大于视觉预算下可能用到的长度）。
 */
export const CARD_NAME_CHAR_HARD_CAP = 32

/**
 * 卡名整体水平缩放下限（相对 `z.name.maxWidth`）。
 * 低于此则不再缩小整串，改为省略号截断，避免字过小不可读。
 */
/** 卡名整串水平缩放可接受下限（再低则先缩字宽仍过长再截断） */
export const CARD_NAME_MIN_SCALE_X = 0.18

/** 逻辑宽度（与既有预览一致） */
export const CARD_W = 350

/** 保持与官方模板相同宽高比 */
export const CARD_H = Math.round((YGO_MOLD_REF.h * CARD_W) / YGO_MOLD_REF.w)

/** @deprecated 使用 CARD_W */
export const CARD_LAYOUT = {
  w: CARD_W,
  h: CARD_H,
  pad: 10,
  outerStroke: 3,
  nameBandH: 38,
  art: {
    x: (100 * CARD_W) / YGO_MOLD_REF.w,
    y: (219 * CARD_W) / YGO_MOLD_REF.w,
    w: (614 * CARD_W) / YGO_MOLD_REF.w,
    h: (616 * CARD_W) / YGO_MOLD_REF.w,
  },
  typeLine: { h: 22 },
  textGap: 4,
  statsBarH: 28,
  footerH: 30,
}

export function layoutScale(canvasW = CARD_W) {
  return canvasW / YGO_MOLD_REF.w
}

/**
 * @param {Record<string, unknown>} card normalizeCard 后的卡片
 * @param {number} canvasW
 */
export function scaledPicRect(card, canvasW = CARD_W) {
  const r = layoutScale(canvasW)
  const isPendulum =
    card.cardType === 'monster' && card.monsterCategory === 'pendulum'
  const ref = isPendulum ? [57, 213, 702, 528] : [100, 219, 614, 616]
  return {
    x: ref[0] * r,
    y: ref[1] * r,
    w: ref[2] * r,
    h: ref[3] * r,
  }
}

/**
 * 文本与其它元素的缩放坐标（单位：像素）
 * @param {Record<string, unknown>} card
 * @param {number} canvasW
 * @param {number} canvasH
 */
export function getYgoLayoutZones(card, canvasW = CARD_W, canvasH = CARD_H) {
  const r = layoutScale(canvasW)
  const pic = scaledPicRect(card, canvasW)
  const isMonster = card.cardType === 'monster'
  const cat = card.monsterCategory || 'effect'
  const isLink = isMonster && cat === 'link'
  const isXyz = isMonster && cat === 'xyz'

  const attribute = {
    x: 680 * r,
    y: 57 * r,
    w: 75 * r,
    h: 75 * r,
  }
  const attrCx = attribute.x + attribute.w / 2
  const attrCy = attribute.y + attribute.h / 2
  const attrR = Math.min(attribute.w, attribute.h) / 2

  /** 卡名区：对齐 ygo-card common.js name.position [65, 96] */
  const name = { x: 65 * r, y: 96 * r, maxWidth: 610 * r }

  const levelRef = {
    baseX: 686 * r,
    baseY: 145 * r,
    /** 星星左上角锚点（非超量：向左递增） */
    distance: 55 * r,
    starSize: 50 * r,
  }

  /** 种族行：与效果正文左缘对齐（ygo-card monsterDesc.position[0]=64） */
  const raceLine = { x: 64 * r, y: 915 * r, maxWidth: 683 * r }

  /** 魔陷类型标题：与 spellDesc 左对齐；Y 略上移避免偏下 */
  const spellTypeLine = { x: 66 * r, y: 166 * r, maxWidth: 683 * r }

  /** 描述行高为参考值；实际绘制在 cardCanvasDraw 中按可读性下限再放大 */
  const monsterDesc = {
    x: 64 * r,
    y: 942 * r,
    maxWidth: 683 * r,
    lineHeight: 28 * r,
    maxLines: 6,
  }

  const spellDesc = {
    x: 66 * r,
    y: 915 * r,
    maxWidth: 683 * r,
    lineHeight: 27 * r,
    maxLines: 9,
  }

  const pendDesc = {
    x: 128 * r,
    y: 770 * r,
    maxWidth: 556 * r,
    lineHeight: 26 * r,
    maxLines: 5,
  }

  /**
   * 攻防行：中文标签（cn_fzdbs）与数字（number）分区排布，留出间距避免遮挡。
   */
  const statsY = 1095 * r
  const atk = {
    x: 552 * r,
    y: statsY,
    maxWidth: 64 * r,
    labelX: 424 * r,
    labelY: statsY,
  }

  const def = {
    x: 730 * r,
    y: statsY,
    maxWidth: 64 * r,
    labelX: 600 * r,
    labelY: statsY,
  }

  const linkDef = {
    x: 732 * r,
    y: statsY,
    maxWidth: 64 * r,
    linkLabelX: 638 * r,
    linkLabelY: statsY,
  }

  const lineUnderStats = {
    x: 56 * r,
    y: 1072 * r,
    w: 672 * r,
  }

  const password = { x: 40 * r, y: 1147 * r }
  const copyright = { x: 730 * r, y: 1146 * r }

  return {
    w: canvasW,
    h: canvasH,
    r,
    pic,
    attribute,
    attrCx,
    attrCy,
    attrR,
    name,
    levelRef,
    raceLine,
    spellTypeLine,
    monsterDesc,
    spellDesc,
    pendDesc,
    lineUnderStats,
    atk,
    def,
    linkDef,
    password,
    copyright,
    isMonster,
    isLink,
    isXyz,
    isPendulum: isMonster && cat === 'pendulum',
  }
}

/** 框架底色（无 Mold 图时的占位绘制） */
export const FRAME_THEME = {
  monster: {
    outer: '#1a0a0a',
    inner: '#3d1818',
    face: '#f4ead8',
    nameBar: '#0d0d0d',
    artMat: '#c8c4bc',
  },
  spell: {
    outer: '#0a1f0a',
    inner: '#144018',
    face: '#eef6e8',
    nameBar: '#0d1f0d',
    artMat: '#c5d4c0',
  },
  trap: {
    outer: '#160616',
    inner: '#351438',
    face: '#f2eaf4',
    nameBar: '#160616',
    artMat: '#cfc6d4',
  },
}
