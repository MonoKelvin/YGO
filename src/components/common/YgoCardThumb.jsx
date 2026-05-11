import { useCallback, useEffect, useState } from 'react'
import placeholderUrl from '../../assets/Mold/placeholder.png'
import { getCardImageUrl } from '../../config/ygoCardUtils'
import {
  ensureYgoCardCached,
  readYgoCardCache,
} from '../../services/ygoCardCacheClient'

function metaForThumb(card, cardId) {
  const id = card?.id ?? cardId
  if (id == null) return null
  if (card && Number(card.id) === Number(id)) return card
  return { id }
}

/**
 * 卡组/编辑器用小图：优先本地缓存 → getCardImageUrl → CDN 小图；桌面端后台 ensure 下载；
 * onError 再试 CDN，仍失败则用占位图。
 */
export default function YgoCardThumb({ card, cardId, imgClassName, alt = '' }) {
  const id = card?.id ?? cardId
  const cacheSig = card?.card_images?.[0]?.image_url_small ?? ''

  const [src, setSrc] = useState(placeholderUrl)

  useEffect(() => {
    const m = metaForThumb(card, cardId)
    const nid = m?.id
    if (nid == null) {
      setSrc(placeholderUrl)
      return undefined
    }
    let cancelled = false
    ;(async () => {
      const cached = await readYgoCardCache(nid)
      if (cancelled) return
      const remote = getCardImageUrl(m)
      const cdnSmall = `https://images.ygoprodeck.com/images/cards_small/${nid}.jpg`
      if (cached?.thumbFileUrl) {
        setSrc(cached.thumbFileUrl)
      } else {
        setSrc(remote || cdnSmall)
      }
      await ensureYgoCardCached(m)
      if (cancelled) return
      const again = await readYgoCardCache(nid)
      if (again?.thumbFileUrl) setSrc(again.thumbFileUrl)
    })()
    return () => {
      cancelled = true
    }
  }, [card, cardId, cacheSig])

  const onImgError = useCallback(() => {
    setSrc((prev) => {
      if (prev === placeholderUrl) return prev
      const cdnSmall =
        id != null
          ? `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`
          : null
      if (cdnSmall && prev !== cdnSmall) return cdnSmall
      return placeholderUrl
    })
  }, [id])

  return (
    <img
      className={imgClassName}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
      onError={onImgError}
    />
  )
}
