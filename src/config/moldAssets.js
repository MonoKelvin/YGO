/**
 * 仅收录 Mold 内真实存在的 PNG/JPG/WebP（不自建矢量图标）。
 * 缺失的属性/魔陷图标：使用内置 `placeholder.png` 空白图（见 CardPreview）。
 */
import placeholderImportedUrl from '../assets/Mold/placeholder.png?url'
import { getAllExpectedMoldPaths } from './moldExpectedPaths'

const moldModules = import.meta.glob('../assets/Mold/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** 内置空白占位图 URL（Vite 处理） */
export const PLACEHOLDER_ASSET_URL = placeholderImportedUrl

/** @type {Record<string, string>} */
const urlByRelativePath = {}

for (const fullPath of Object.keys(moldModules)) {
  const rel = fullPath
    .replace(/^\.\.\/assets\/Mold\//, '')
    .replace(/^.*\/assets\/Mold\//, '')
    .replace(/\\/g, '/')
  urlByRelativePath[rel.toLowerCase()] = moldModules[fullPath]
}

/**
 * @param {string} relativePath Mold 内相对路径
 * @returns {string | null}
 */
export function getMoldAssetUrl(relativePath) {
  if (!relativePath) return null
  const key = relativePath.replace(/\\/g, '/').replace(/^\//, '').toLowerCase()
  if (urlByRelativePath[key]) return urlByRelativePath[key]
  const base = key.replace(/\.[^.]+$/, '')
  const altKeys = ['png', 'jpg', 'jpeg', 'webp'].map((ext) => `${base}.${ext}`)
  for (const k of altKeys) {
    if (urlByRelativePath[k]) return urlByRelativePath[k]
  }
  return null
}

function firstExisting(paths) {
  for (const p of paths) {
    const u = getMoldAssetUrl(p)
    if (u) return u
  }
  return null
}

function firstUrlMatching(predicate) {
  const keys = Object.keys(urlByRelativePath).sort()
  for (const rel of keys) {
    if (predicate(rel)) return urlByRelativePath[rel]
  }
  return null
}

/**
 * @param {string} attribute 怪兽属性 key
 */
export function resolveAttributeArtUrl(attribute) {
  const key = (attribute || 'earth').toLowerCase()
  return firstExisting([
    `Attribute/cn/${key}.png`,
    `Attribute/cn/${key}.jpg`,
    `Attribute/en/${key}.png`,
    `Attribute/en/${key}.jpg`,
    `Attribute/jp/${key}.png`,
    `Attribute/jp/${key}.jpg`,
  ])
}

const IMG_EXT = ['jpg', 'png', 'jpeg', 'webp']

function expandFrameBase(dirFileNoExt) {
  const out = []
  for (const ext of IMG_EXT) {
    out.push(`${dirFileNoExt}.${ext}`)
  }
  return out
}

/**
 * Mold/Frame 下常见拼音缩写（与 ygo-card 族素材一致，如 cl=超量、lb=灵摆、tc=通常、xg=效果）
 * @see https://github.com/yamiyang/ygo-card/tree/master/source
 */
const MONSTER_SUFFIX_BY_CATEGORY = {
  normal: ['tc', 'tt', 'normal'],
  effect: ['xg', 'tk', 'effect'],
  ritual: ['ys', 'ls', 'ritual'],
  fusion: ['rh', 'fusion'],
  synchro: ['td', 'tt', 'synchro'],
  xyz: ['cl', 'xyz'],
  pendulum: ['lb', 'pendulum'],
  link: ['lj', 'link'],
}

function monsterFramePathCandidates(monsterCategory) {
  const cat = (monsterCategory || 'effect').toLowerCase()
  const candidates = []

  if (cat === 'pendulum') {
    candidates.push(
      ...expandFrameBase('Frame/monster_cl_lb'),
      ...expandFrameBase('Frame/monster_tk_lb'),
      ...expandFrameBase('Frame/monster_lb'),
    )
  }

  const suffixes = MONSTER_SUFFIX_BY_CATEGORY[cat] || MONSTER_SUFFIX_BY_CATEGORY.effect
  for (const s of suffixes) {
    candidates.push(...expandFrameBase(`Frame/monster_${s}`))
  }

  candidates.push(
    ...expandFrameBase('Frame/monster'),
    ...expandFrameBase('Frame/normal'),
  )
  return candidates
}

/**
 * 根据完整卡牌数据选择边框（怪兽卡按怪兽类别选 monster_xg / monster_cl 等）
 * @param {Record<string, unknown>} card
 */
export function resolveFrameArtUrl(card) {
  const cardType = card?.cardType || 'monster'
  if (cardType === 'monster') {
    const exact = firstExisting(monsterFramePathCandidates(card?.monsterCategory))
    if (exact) return exact
    return firstUrlMatching((rel) =>
      /^frame\/monster[^/]*\.(png|jpg|jpeg|webp)$/.test(rel),
    )
  }
  if (cardType === 'spell') {
    return firstExisting([
      'Frame/spell.jpg',
      'Frame/spell.png',
      'Frame/magic.jpg',
      'Frame/magic.png',
    ])
  }
  if (cardType === 'trap') {
    return firstExisting(['Frame/trap.jpg', 'Frame/trap.png'])
  }
  return null
}

/**
 * 魔法 / 陷阱右上角：优先 Icon，其次 Attribute 目录（多数 Mold 包放在 Attribute/cn）
 */
/**
 * 等级星图标：超量用 Star/rank，其余（含灵摆上的星级）用 Star/level。
 * 素材缺失时由画布回退为矢量星。
 */
export function resolveMonsterStarIconUrl(card) {
  if ((card?.cardType || 'monster') !== 'monster') return null
  const isXyz = String(card?.monsterCategory || '').toLowerCase() === 'xyz'
  if (isXyz) {
    return firstExisting([
      'Star/rank.png',
      'Star/rank.jpg',
      'Star/rank.webp',
      'star/rank.png',
    ])
  }
  return firstExisting([
    'Star/level.png',
    'Star/level.jpg',
    'Star/level.webp',
    'star/level.png',
  ])
}

export function resolveSpellTrapArtUrl(cardType) {
  if (cardType === 'spell') {
    return firstExisting([
      'Icon/spell.png',
      'Icon/spell.jpg',
      'Attribute/cn/spell.png',
      'Attribute/cn/spell.jpg',
      'Attribute/en/spell.png',
      'Attribute/jp/spell.png',
    ])
  }
  if (cardType === 'trap') {
    return firstExisting([
      'Icon/trap.png',
      'Icon/trap.jpg',
      'Attribute/cn/trap.png',
      'Attribute/cn/trap.jpg',
      'Attribute/en/trap.png',
      'Attribute/jp/trap.png',
    ])
  }
  return null
}

/**
 * 与 `moldExpectedPaths` 对比；仅用于开发自检（不含内置 placeholder）。
 * @returns {string[]}
 */
export function listMissingMoldAssets() {
  return getAllExpectedMoldPaths().filter((p) => !getMoldAssetUrl(p))
}
