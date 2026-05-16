import { toast } from '@lobehub/ui'
import { openExternalLink } from './openExternalLink'

/**
 * 将本地绝对路径转为可在画布 `<img>` 中加载的 file URL（Electron 渲染进程）
 * @param {string} absPath
 * @returns {string}
 */
export function absolutePathToFileUrl(absPath) {
  const raw = String(absPath || '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const encoded = encodeURI(raw).replace(/#/g, '%23')
  if (/^[a-zA-Z]:\//.test(encoded)) {
    return `file:///${encoded}`
  }
  if (encoded.startsWith('/')) {
    return `file://${encoded}`
  }
  return encoded
}

/**
 * 判断是否为 http(s) 在线插图地址
 * @param {string} s
 */
export function isHttpImageUrl(s) {
  return /^https?:\/\//i.test(String(s || '').trim())
}

/**
 * 将 file URL 转为界面展示的本地路径（Windows 尽量还原为 `C:\...`）
 * @param {string} fileUrl
 * @returns {string}
 */
export function fileUrlToDisplayPath(fileUrl) {
  const raw = String(fileUrl || '').trim()
  if (!raw.toLowerCase().startsWith('file:')) {
    return ''
  }
  try {
    const u = new URL(raw)
    let p = decodeURIComponent(u.pathname || '')
    if (p.startsWith('/') && /^\/[a-zA-Z]:\//.test(p)) {
      p = p.slice(1)
    }
    if (/^[a-zA-Z]:/.test(p)) {
      return p.replace(/\//g, '\\')
    }
    return p.replace(/^\//, '')
  } catch {
    return ''
  }
}

/**
 * 点击副标题：在资源管理器中定位本地文件，或按设置打开在线地址
 * @param {{ displayPath: string, imagePath: string }} opts
 */
export async function openCardIllustrationLocation({ displayPath, imagePath }) {
  const disp = String(displayPath || '').trim()
  const img = String(imagePath || '').trim()

  if (!disp && !img) {
    return
  }

  if (disp.startsWith('data:') || img.startsWith('data:')) {
    toast.info({
      title: '无法打开位置',
      description: '当前为嵌入的本地图片数据，未关联磁盘路径。',
    })
    return
  }

  const urlCandidate = isHttpImageUrl(disp) ? disp : isHttpImageUrl(img) ? img : ''
  if (urlCandidate) {
    await openExternalLink(urlCandidate)
    return
  }

  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  const localPath = disp || img

  if (electron?.revealFileInFolder) {
    const res = await electron.revealFileInFolder(localPath)
    if (res?.success) {
      return
    }
    if (electron.openPathInExplorer) {
      const res2 = await electron.openPathInExplorer(localPath)
      if (res2?.success) {
        return
      }
    }
    toast.error({
      title: '打开失败',
      description: res?.error || '无法在资源管理器中定位该文件',
    })
    return
  }

  toast.warning({
    title: '无法打开',
    description: '当前环境不支持在资源管理器中打开路径。',
  })
}

/** 主进程拉取的远程插图 Data URL 缓存，减轻重复绘制与导出压力 */
const remoteImageDataUrlCache = new Map()
const REMOTE_IMG_CACHE_MAX = 32
const REMOTE_IMG_CACHE_TTL_MS = 5 * 60 * 1000

function cacheRemoteDataUrl(url, dataUrl) {
  if (remoteImageDataUrlCache.size >= REMOTE_IMG_CACHE_MAX) {
    const firstKey = remoteImageDataUrlCache.keys().next().value
    remoteImageDataUrlCache.delete(firstKey)
  }
  remoteImageDataUrlCache.set(url, { dataUrl, t: Date.now() })
}

function getCachedRemoteDataUrl(url) {
  const row = remoteImageDataUrlCache.get(url)
  if (!row) {
    return null
  }
  if (Date.now() - row.t > REMOTE_IMG_CACHE_TTL_MS) {
    remoteImageDataUrlCache.delete(url)
    return null
  }
  return row.dataUrl
}

/**
 * 探测 URL 是否可作为插图加载（用于表单校验）
 * Electron 下优先走主进程请求，避免防盗链 / 默认 UA 导致 `<img>` 探测失败。
 * @param {string} url
 * @returns {Promise<void>}
 */
export async function probeImageUrl(url) {
  const u = String(url || '').trim()
  if (!isHttpImageUrl(u)) {
    throw new Error('invalid url')
  }

  const api = typeof window !== 'undefined' ? window.electronAPI : null
  if (api?.probeRemoteImageUrl) {
    const remote = await api.probeRemoteImageUrl(u)
    if (remote?.success) {
      return
    }
  }

  const probeOnce = (withCors) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      if (withCors) {
        img.crossOrigin = 'anonymous'
      }
      const t = window.setTimeout(() => {
        reject(new Error('timeout'))
      }, 25000)
      img.onload = () => {
        window.clearTimeout(t)
        resolve(undefined)
      }
      img.onerror = () => {
        window.clearTimeout(t)
        reject(new Error('load error'))
      }
      img.src = u
    })

  await probeOnce(true).catch(() => probeOnce(false))
}

/**
 * 解析为可在 canvas 中 `new Image().src` 使用的地址。
 * - Electron + webSecurity：本地路径由主进程读盘返回 Data URL。
 * - http(s)：在 Electron 中由主进程拉取并转为 Data URL，避免 CORS / 防盗链，且导出 PNG 时画布不被污染。
 * @param {string} src
 * @returns {Promise<string>}
 */
export async function resolveImageSrcForPreview(src) {
  const s = String(src || '').trim()
  if (!s) {
    return ''
  }
  if (s.startsWith('data:')) {
    return s
  }
  if (/^https?:/i.test(s)) {
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (api?.fetchRemoteImageAsDataUrl) {
      const cached = getCachedRemoteDataUrl(s)
      if (cached) {
        return cached
      }
      try {
        const res = await api.fetchRemoteImageAsDataUrl(s)
        if (res?.success && res.dataUrl) {
          cacheRemoteDataUrl(s, res.dataUrl)
          return res.dataUrl
        }
      } catch {
        /* 回退为直连 URL（浏览器或非 Electron） */
      }
    }
    return s
  }

  const api = typeof window !== 'undefined' ? window.electronAPI : null
  if (api?.readLocalImageAsDataUrl) {
    try {
      let key = s
      if (!/^file:/i.test(s) && (/^[a-zA-Z]:[\\/]/.test(s) || s.startsWith('\\\\'))) {
        key = absolutePathToFileUrl(s)
      }
      const res = await api.readLocalImageAsDataUrl(key)
      if (res?.success && res.dataUrl) {
        return res.dataUrl
      }
    } catch {
      /* 回退到原始 src */
    }
  }

  return s
}
