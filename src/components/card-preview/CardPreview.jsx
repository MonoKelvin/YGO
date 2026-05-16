import { useEffect, useMemo, useRef } from 'react'
import { CARD_LAYOUT } from '../../config/cardLayout'
import { normalizeCard } from '../../config/cardConstants'
import {
  PLACEHOLDER_ASSET_URL,
  resolveAttributeArtUrl,
  resolveFrameArtUrl,
  resolveMonsterStarIconUrl,
  resolveSpellTrapArtUrl,
} from '../../config/moldAssets'
import { ensureMoldFontsLoaded } from '../../config/moldFonts'
import { resolveImageSrcForPreview } from '../../utils/cardIllustrationActions'
import { paintCard } from './cardCanvasDraw'
import './CardPreview.css'

/**
 * @param {{ src: string }} props
 * @returns {Promise<HTMLImageElement | null>}
 */
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const isHttp = /^https?:/i.test(src)
    const loadOnce = (withCors) => {
      const img = new Image()
      if (withCors && isHttp) {
        img.crossOrigin = 'anonymous'
      }
      img.onload = () => resolve(img)
      img.onerror = () => {
        if (withCors && isHttp) {
          loadOnce(false)
        } else {
          resolve(null)
        }
      }
      img.src = src
    }
    loadOnce(isHttp)
  })
}

/**
 * 在空闲或下一宏任务再绘制，避免与表单输入同一帧争抢主线程造成卡顿。
 * @param {() => void} fn
 * @returns {number}
 */
function schedulePaintWork(fn) {
  if (typeof window === 'undefined') {
    return 0
  }
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(fn, { timeout: 800 })
  }
  return window.setTimeout(fn, 0)
}

function cancelScheduledPaint(id) {
  if (id == null || typeof window === 'undefined') {
    return
  }
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    window.clearTimeout(id)
  }
}

/**
 * 游戏王卡牌画布预览（分区对齐实体卡常见排版，可选叠加 `assets/Mold` 素材）
 * @param {{ card: Record<string, unknown>, className?: string, canvasClassName?: string }} props
 */
export default function CardPreview({ card: rawCard, className = '', canvasClassName = '' }) {
  const canvasRef = useRef(null)
  const card = useMemo(() => normalizeCard(rawCard || {}), [rawCard])
  const cardSnapshot = useMemo(() => JSON.stringify(card), [card])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = CARD_LAYOUT.w
    const H = CARD_LAYOUT.h
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)

    canvas.width = W * dpr
    canvas.height = H * dpr
    /** 显示尺寸随容器缩放，避免右侧预览栏宽度小于逻辑宽度时画布溢出 */
    canvas.style.width = '100%'
    canvas.style.maxWidth = `${W}px`
    canvas.style.height = 'auto'
    canvas.style.display = 'block'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let cancelled = false
    const idleId = schedulePaintWork(() => {
      void (async () => {
        try {
          if (cancelled) return
          await ensureMoldFontsLoaded()
          if (cancelled) return
          if (typeof document !== 'undefined' && document.fonts?.ready) {
            try {
              await document.fonts.ready
            } catch {
              /* ignore */
            }
          }
          if (cancelled) return

          const frameUrl = resolveFrameArtUrl(card)
          const resolvedAttr =
            card.cardType === 'monster'
              ? resolveAttributeArtUrl(card.attribute)
              : resolveSpellTrapArtUrl(card.cardType)
          const attrUrl =
            resolvedAttr ||
            (card.cardType === 'monster' && !(card.attribute && String(card.attribute).trim())
              ? ''
              : PLACEHOLDER_ASSET_URL)
          const starUrl = resolveMonsterStarIconUrl(card) || ''

          let artSrc = ''
          try {
            artSrc = await resolveImageSrcForPreview(card.imagePath || '')
          } catch {
            artSrc = String(card.imagePath || '').trim()
          }

          const [frameImg, attrImg, artImg, starIconImg] = await Promise.all([
            loadImage(frameUrl),
            loadImage(attrUrl),
            loadImage(artSrc),
            loadImage(starUrl),
          ])

          if (cancelled) return

          paintCard(ctx, card, {
            frameImg: frameImg || undefined,
            attrImg: attrImg || undefined,
            artImg: artImg || undefined,
            starIconImg: starIconImg || undefined,
          })
        } catch (err) {
          console.error('[CardPreview] paint failed', err)
        }
      })()
    })

    return () => {
      cancelled = true
      cancelScheduledPaint(idleId)
    }
  }, [cardSnapshot])

  return (
    <div className={`card-preview ${className}`.trim()}>
      <canvas
        ref={canvasRef}
        className={`card-preview-canvas ${canvasClassName}`.trim()}
        aria-label={card.name || '卡牌预览'}
      />
    </div>
  )
}
