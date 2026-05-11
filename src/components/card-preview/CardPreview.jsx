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
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
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

    async function paint() {
      await ensureMoldFontsLoaded()
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        try {
          await document.fonts.ready
        } catch {
          /* ignore */
        }
      }
      const frameUrl = resolveFrameArtUrl(card)
      const resolvedAttr =
        card.cardType === 'monster'
          ? resolveAttributeArtUrl(card.attribute)
          : resolveSpellTrapArtUrl(card.cardType)
      /** 框架图缺失时不叠整张占位图；属性/魔陷图标缺失时用空白占位 */
      const attrUrl = resolvedAttr || PLACEHOLDER_ASSET_URL
      const starUrl = resolveMonsterStarIconUrl(card) || ''

      const [frameImg, attrImg, artImg, starIconImg] = await Promise.all([
        loadImage(frameUrl),
        loadImage(attrUrl),
        loadImage(card.imagePath || ''),
        loadImage(starUrl),
      ])

      if (cancelled) return

      paintCard(ctx, card, {
        frameImg: frameImg || undefined,
        attrImg: attrImg || undefined,
        artImg: artImg || undefined,
        starIconImg: starIconImg || undefined,
      })
    }

    paint()
    return () => {
      cancelled = true
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
