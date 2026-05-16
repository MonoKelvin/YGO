import { toast } from '@lobehub/ui'

import {
  getCardImageUrl,
  getCardImageUrlLarge,
} from '../../config/ygoCardUtils'

export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** 上次加入的卡组置顶，其余按置顶与时间排序（与卡组列表一致） */
export function sortDecksForAddPicker(decks, lastAddTargetDeckId) {
  const list = [...decks]
  list.sort((a, b) => {
    const ap = Boolean(a.pinned)
    const bp = Boolean(b.pinned)
    if (ap !== bp) return ap ? -1 : 1
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })
  if (!lastAddTargetDeckId) return list
  const ix = list.findIndex((d) => d.id === lastAddTargetDeckId)
  if (ix <= 0) return list
  const [one] = list.splice(ix, 1)
  return [one, ...list]
}

export function guessExtFromUrl(urlStr) {
  try {
    const u = new URL(urlStr, window.location.href)
    const m = u.pathname.match(/\.(png|webp|jpe?g)$/i)
    if (m) return m[1].toLowerCase().replace(/^jpeg$/, 'jpg')
  } catch {
    /* ignore */
  }
  return null
}

/**
 * 下载卡图：桌面版先选保存路径再由主进程拉取；浏览器环境回退为触发下载。
 * @param {Record<string, unknown>} card
 */
export async function downloadCardImage(card) {
  const url = getCardImageUrlLarge(card) || getCardImageUrl(card)
  if (!url) {
    toast.warning('无可用卡图地址')
    return
  }
  const safeName = String(card.name || 'card').replace(/[/\\?%*:|"<>]/g, '_')
  const idPart = card.id != null ? String(card.id) : '0'
  const api = typeof window !== 'undefined' ? window.electronAPI : null
  let ext = guessExtFromUrl(url) || 'jpg'
  const baseFile = `${idPart}-${safeName}.${ext}`

  if (api?.saveRemoteImageAs) {
    try {
      const res = await api.saveRemoteImageAs({ url, defaultPath: baseFile })
      if (res?.canceled) {
        return
      }
      if (res?.success) {
        toast.success('卡图已保存')
        return
      }
      toast.error(res?.error || '保存失败')
    } catch (e) {
      toast.error(e?.message || '保存失败')
    }
    return
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const blob = await res.blob()
    if (!guessExtFromUrl(url)) {
      if (blob.type.includes('png')) ext = 'png'
      else if (blob.type.includes('webp')) ext = 'webp'
      else if (blob.type.includes('jpeg') || blob.type.includes('jpg')) ext = 'jpg'
    }

    const fileName = `${idPart}-${safeName}.${ext}`
    const buf = await blob.arrayBuffer()

    if (api?.saveFileDialog && api?.writeFile) {
      const dlg = await api.saveFileDialog({
        title: '保存卡图',
        defaultPath: fileName,
        filters: [
          { name: '图像', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })
      if (dlg.canceled || !dlg.filePath) {
        return
      }
      const wr = await api.writeFile(dlg.filePath, bufferToBase64(buf))
      if (wr.success) {
        toast.success('卡图已保存')
      } else {
        toast.error(wr.error || '保存失败')
      }
      return
    }

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
    toast.success('已开始下载')
  } catch (e) {
    toast.error(e?.message || '下载失败')
  }
}
