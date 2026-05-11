import { getCardImageUrl } from '../config/ygoCardUtils'

const inflight = new Map()

/**
 * 将远程小图与基础元数据写入数据目录（桌面版）。失败不抛错，返回 null。
 * @param {Record<string, unknown>} card
 * @returns {Promise<{ thumbFileUrl?: string } | null>}
 */
export async function ensureYgoCardCached(card) {
  const api = typeof window !== 'undefined' ? window.electronAPI : null
  if (!api?.ygoCardCacheEnsure) return null
  const id = card?.id
  if (id == null) return null
  if (inflight.has(id)) {
    try {
      return await inflight.get(id)
    } catch {
      return null
    }
  }
  const imageUrl = getCardImageUrl(card)
  if (!imageUrl) {
    return null
  }
  const p = api
    .ygoCardCacheEnsure({
      id,
      imageUrl,
      meta: {
        id,
        name: card.name,
        type: card.type,
        frameType: card.frameType,
      },
    })
    .then((res) => (res && res.success ? res : null))
    .catch(() => null)
  inflight.set(id, p)
  try {
    return await p
  } finally {
    inflight.delete(id)
  }
}

/**
 * 仅读取已缓存的缩略图 file URL（不发起下载）
 * @param {number} cardId
 */
export async function readYgoCardCache(cardId) {
  const api = typeof window !== 'undefined' ? window.electronAPI : null
  if (!api?.ygoCardCacheRead) return null
  if (cardId == null) return null
  const res = await api.ygoCardCacheRead(cardId)
  if (!res || !res.success) return null
  return res
}
