/**
 * 加载 Mold/Font 下的字体供卡牌画布使用（与 ygo-card 类似：独立字体文件 + canvas font 引用）。
 * 若目录为空则回退系统字体栈。
 */
const FALLBACK =
  'Arial, "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif'

const fontUrlModules = import.meta.glob('../assets/Mold/Font/**/*.{ttf,otf,woff2}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** @type {{ name: string, desc: string } | null} */
let resolved = null

function slugFromPath(fullPath) {
  const rel = fullPath
    .replace(/^\.\.\/assets\/Mold\/Font\//, '')
    .replace(/\\/g, '/')
  const base = rel.split('/').pop() || ''
  return base.replace(/\.[^.]+$/, '')
}

function pickFamilies(paths) {
  if (paths.length === 0) {
    return { nameFamily: null, descFamily: null }
  }
  const slug = (p) => slugFromPath(p).toLowerCase()
  /** 与 ygo-card 常见命名：number/en_name 卡名；cn/jp 描述正文 */
  const namePick =
    paths.find((p) => /number|en_name|name|password|title|race|link/.test(slug(p))) ||
    paths[0]
  const descPick =
    paths.find((p) =>
      /^cn$|cn_backup|jp_notation|^jp$|desc|text|hei|kai/.test(slug(p)),
    ) ||
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
 * @returns {Promise<{ name: string, desc: string }>} CSS font-family 栈（含引号字体名）
 */
export async function ensureMoldFontsLoaded() {
  if (resolved) {
    return {
      name: resolved.name,
      desc: resolved.desc,
    }
  }

  const paths = Object.keys(fontUrlModules)
  if (paths.length === 0) {
    resolved = { name: FALLBACK, desc: FALLBACK }
    return { name: resolved.name, desc: resolved.desc }
  }

  const { nameFamily, descFamily, namePath, descPath } = pickFamilies(paths)

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

  resolved = {
    name: nameFamily ? `"${nameFamily}", ${FALLBACK}` : FALLBACK,
    desc: descFamily ? `"${descFamily}", ${FALLBACK}` : FALLBACK,
  }
  return { name: resolved.name, desc: resolved.desc }
}

/** 同步读取（须在 ensureMoldFontsLoaded 解析完成后调用） */
export function getMoldFontStacks() {
  if (!resolved) {
    return { name: FALLBACK, desc: FALLBACK }
  }
  return { name: resolved.name, desc: resolved.desc }
}
