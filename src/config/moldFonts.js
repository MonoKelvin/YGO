/**
 * 加载 Mold/Font 下的字体供卡牌画布使用（与 ygo-card 类似：独立字体文件 + canvas font 引用）。
 * 卡名、魔陷类型行等标题类中文使用 **cn.ttf**（与 cn_simplify / cn_backup 区分）。
 * 若目录为空则回退系统字体栈。
 */
const FALLBACK =
  'Arial, "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif'

const fontUrlModules = import.meta.glob('../assets/Mold/Font/**/*.{ttf,otf,woff2}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** @type {{ name: string, desc: string, cnTitle: string, statsCn: string } | null} */
let resolved = null

function slugFromPath(fullPath) {
  const rel = fullPath
    .replace(/^\.\.\/assets\/Mold\/Font\//, '')
    .replace(/\\/g, '/')
  const base = rel.split('/').pop() || ''
  return base.replace(/\.[^.]+$/, '')
}

function slugLower(fullPath) {
  return slugFromPath(fullPath).toLowerCase()
}

/**
 * 攻防区中文（攻/、防/、连/、無限大）：**cn_fzdbs.ttf**
 * @param {string[]} paths
 * @returns {string | null}
 */
function pickCnFzdbsPath(paths) {
  const byExact = paths.find((p) => slugLower(p) === 'cn_fzdbs')
  if (byExact) {
    return byExact
  }
  return paths.find((p) => slugLower(p).includes('fzdbs')) || null
}

/**
 * 卡名 / 魔陷类型等：优先精确匹配 **cn.ttf**（文件名 slug 为 `cn`，排除 simplify、backup 等）
 * @param {string[]} paths
 * @returns {string | null}
 */
function pickCnTitleFontPath(paths) {
  const exact = paths.find((p) => slugLower(p) === 'cn')
  if (exact) {
    return exact
  }
  return null
}

function pickFamilies(paths) {
  if (paths.length === 0) {
    return { nameFamily: null, descFamily: null, namePath: null, descPath: null }
  }
  const slug = (p) => slugLower(p)
  /**
   * 卡面数字与攻防等：须优先 **number.ttf**（ygo-card ATK.font）。
   * 勿用 `/number|...|link/` 单次匹配：glob 顺序下可能先命中 link.ttf。
   */
  const namePick =
    paths.find((p) => slug(p) === 'number') ||
    paths.find((p) => /en_name|password|title/.test(slug(p))) ||
    paths.find((p) => slug(p) === 'race') ||
    paths.find((p) => slug(p) === 'link') ||
    paths[0]
  const descPick =
    paths.find((p) =>
      /cn_simplify|cn_backup|jp_notation|^jp$|desc|text|hei|kai/.test(slug(p)),
    ) ||
    paths.find((p) => slug(p) === 'cn') ||
    paths.find((p) => p !== namePick) ||
    namePick
  return {
    nameFamily: `YgoMold_${slugFromPath(namePick).replace(/[^\w\u4e00-\u9fff-]/g, '_')}`,
    descFamily: `YgoMold_${slugFromPath(descPick).replace(/[^\w\u4e00-\u9fff-]/g, '_')}`,
    namePath: namePick,
    descPath: descPick,
  }
}

/**
 * @returns {Promise<{ name: string, desc: string, cnTitle: string, statsCn: string }>} CSS font-family 栈
 */
export async function ensureMoldFontsLoaded() {
  if (resolved) {
    return {
      name: resolved.name,
      desc: resolved.desc,
      cnTitle: resolved.cnTitle,
      statsCn: resolved.statsCn,
    }
  }

  const paths = Object.keys(fontUrlModules)
  if (paths.length === 0) {
    resolved = { name: FALLBACK, desc: FALLBACK, cnTitle: FALLBACK, statsCn: FALLBACK }
    return { name: resolved.name, desc: resolved.desc, cnTitle: resolved.cnTitle, statsCn: resolved.statsCn }
  }

  const { nameFamily, descFamily, namePath, descPath } = pickFamilies(paths)
  const cnTitlePath = pickCnTitleFontPath(paths)
  const cnTitleFamily = cnTitlePath
    ? `YgoMold_${slugFromPath(cnTitlePath).replace(/[^\w\u4e00-\u9fff-]/g, '_')}_cnTitle`
    : null
  const cnFzdbsPath = pickCnFzdbsPath(paths)
  const cnFzdbsFamily = cnFzdbsPath
    ? `YgoMold_${slugFromPath(cnFzdbsPath).replace(/[^\w\u4e00-\u9fff-]/g, '_')}_fzdbs`
    : null

  const resolveUrl = (mod) => {
    if (typeof mod === 'string') return mod
    if (mod && typeof mod === 'object' && 'default' in mod) return mod.default
    return mod
  }

  const loadOne = async (path, family) => {
    const url = resolveUrl(fontUrlModules[path])
    if (!url || !family) return
    try {
      const face = new FontFace(family, `url(${url})`)
      await face.load()
      document.fonts.add(face)
    } catch {
      /* 单个字体失败则沿用回退 */
    }
  }

  await loadOne(namePath, nameFamily)
  await loadOne(descPath, descFamily)
  if (cnTitlePath && cnTitleFamily) {
    await loadOne(cnTitlePath, cnTitleFamily)
  }
  if (cnFzdbsPath && cnFzdbsFamily) {
    await loadOne(cnFzdbsPath, cnFzdbsFamily)
  }

  const nameStack = nameFamily ? `"${nameFamily}", ${FALLBACK}` : FALLBACK
  const descStack = descFamily ? `"${descFamily}", ${FALLBACK}` : FALLBACK
  const cnTitleStack = cnTitleFamily
    ? `"${cnTitleFamily}", ${FALLBACK}`
    : descStack
  const statsCnStack = cnFzdbsFamily
    ? `"${cnFzdbsFamily}", ${FALLBACK}`
    : cnTitleStack

  resolved = {
    name: nameStack,
    desc: descStack,
    cnTitle: cnTitleStack,
    statsCn: statsCnStack,
  }
  return { name: resolved.name, desc: resolved.desc, cnTitle: resolved.cnTitle, statsCn: resolved.statsCn }
}

/** 同步读取（须在 ensureMoldFontsLoaded 解析完成后调用） */
export function getMoldFontStacks() {
  if (!resolved) {
    return { name: FALLBACK, desc: FALLBACK, cnTitle: FALLBACK, statsCn: FALLBACK }
  }
  return {
    name: resolved.name,
    desc: resolved.desc,
    cnTitle: resolved.cnTitle,
    statsCn: resolved.statsCn,
  }
}
