import { useEffect, useState } from 'react'
import CardPreview from '../../components/card-preview'
import { resolveImageSrcForPreview } from '../../utils/cardIllustrationActions'

/** 是否像已导出的本地图片路径（保存卡牌时写入的 PNG 等） */
function isSavedImageFilePath(path) {
  const p = String(path || '').trim()
  if (!p || p.startsWith('data:')) {
    return false
  }
  if (/^https?:\/\//i.test(p)) {
    return false
  }
  return (
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(p) ||
    /^[a-zA-Z]:[\\/]/.test(p) ||
    p.startsWith('\\\\') ||
    /^file:/i.test(p)
  )
}

/**
 * 浏览列表缩略图：优先展示已保存的 PNG（避免与 Canvas 重绘叠成「双卡」）
 * @param {{ card: Record<string, unknown> }} props
 */
export default function CardBrowserThumb({ card }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [failed, setFailed] = useState(false)

  const pathKey = String(card?.imagePath || '').trim()

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    setImgSrc(null)

    if (!pathKey || !isSavedImageFilePath(pathKey)) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      try {
        const src = await resolveImageSrcForPreview(pathKey)
        if (cancelled) {
          return
        }
        if (src && (src.startsWith('data:') || /^https?:/i.test(src))) {
          setImgSrc(src)
        } else {
          setFailed(true)
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pathKey])

  if (imgSrc && !failed) {
    return (
      <img
        className="card-browser-thumb-img"
        src={imgSrc}
        alt={String(card?.name || '卡牌')}
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <CardPreview
      card={card}
      className="card-browser-thumb-preview"
      canvasClassName="card-browser-thumb-canvas"
    />
  )
}
