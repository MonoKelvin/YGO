import { useCallback, useMemo } from 'react'
import { ContextMenuTrigger, toast } from '@lobehub/ui'
import {
  ArrowRightLeft,
  ExternalLink,
  Heart,
  Trash2,
} from 'lucide-react'
import { isExtraDeckCard } from '../../config/ygoCardUtils'
import YgoCardThumb from '../common/YgoCardThumb'
import './DeckZoneTiles.css'

/** @param {{ id: number, n: number }[]} entries */
export function flattenDeckInstances(entries) {
  const tiles = []
  for (const e of entries || []) {
    const n = Math.max(0, Number(e.n) || 0)
    for (let i = 0; i < n; i++) {
      tiles.push({ cardId: e.id, instanceIndex: i })
    }
  }
  return tiles
}

export function selectionKey(zone, cardId, instanceIndex) {
  return `${zone}:${cardId}:${instanceIndex}`
}

export function parseSelectionKey(key) {
  const parts = String(key).split(':')
  if (parts.length < 3) return null
  const zone = parts[0]
  const cardId = Number(parts[1])
  const instanceIndex = Number(parts[2])
  if (!zone || !Number.isFinite(cardId) || !Number.isFinite(instanceIndex)) {
    return null
  }
  return { zone, cardId, instanceIndex }
}

/**
 * @param {{
 *   zone: 'main' | 'extra' | 'side',
 *   entries: { id: number, n: number }[],
 *   deckId: string,
 *   cardById: (id: number) => Record<string, unknown> | undefined,
 *   favoriteSet: Set<number>,
 *   onToggleFavorite: (id: number) => void,
 *   onOpenDetail: (card: Record<string, unknown>) => void,
 *   removeOneFromDeck: (deckId: string, cardId: number, zone: string) => void,
 *   shiftMainSide?: (deckId: string, cardId: number, toSide: boolean) => { ok?: boolean, reason?: string },
 *   selection: Set<string>,
 *   onToggleSelect: (key: string) => void,
 * }} props
 */
export default function DeckZoneTiles({
  zone,
  entries,
  deckId,
  cardById,
  favoriteSet,
  onToggleFavorite,
  onOpenDetail,
  removeOneFromDeck,
  shiftMainSide,
  selection,
  onToggleSelect,
}) {
  const tiles = useMemo(() => flattenDeckInstances(entries), [entries])

  const handleTileClick = useCallback(
    (ev, card, sk) => {
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault()
        ev.stopPropagation()
        onToggleSelect(sk)
        return
      }
      if (card) onOpenDetail(card)
      else toast.warning('暂无该卡数据，请在卡牌数据库浏览或更新本地库')
    },
    [onOpenDetail, onToggleSelect],
  )

  if (tiles.length === 0) {
    return <p className="deck-zone-empty">暂无卡牌</p>
  }

  return (
    <div className="deck-zone-card-flow" role="list">
      {tiles.map(({ cardId, instanceIndex }) => {
        const card = cardById(cardId)
        const sk = selectionKey(zone, cardId, instanceIndex)
        const selected = selection.has(sk)
        const fav = favoriteSet.has(Number(cardId))
        const canSide =
          zone === 'main' && card && !isExtraDeckCard(card)

        const menuItems = [
          {
            key: 'detail',
            icon: <ExternalLink size={14} />,
            label: '打开详情',
            onClick: ({ domEvent }) => {
              domEvent?.stopPropagation?.()
              if (card) onOpenDetail(card)
              else toast.warning('暂无该卡数据')
            },
          },
        ]

        if (zone === 'main' && canSide && shiftMainSide) {
          menuItems.push({
            key: 'side',
            icon: <ArrowRightLeft size={14} />,
            label: '移入副卡组（1 张）',
            onClick: ({ domEvent }) => {
              domEvent?.stopPropagation?.()
              const r = shiftMainSide(deckId, cardId, true)
              if (r && !r.ok && r.reason) toast.warning(r.reason)
            },
          })
        }
        if (zone === 'side' && shiftMainSide) {
          menuItems.push({
            key: 'main',
            icon: <ArrowRightLeft size={14} />,
            label: '移回主卡组（1 张）',
            onClick: ({ domEvent }) => {
              domEvent?.stopPropagation?.()
              const r = shiftMainSide(deckId, cardId, false)
              if (r && !r.ok && r.reason) toast.warning(r.reason)
            },
          })
        }

        menuItems.push(
          {
            key: 'fav',
            icon: <Heart size={14} fill={fav ? 'currentColor' : 'none'} />,
            label: fav ? '取消收藏' : '收藏',
            onClick: ({ domEvent }) => {
              domEvent?.stopPropagation?.()
              onToggleFavorite(cardId)
            },
          },
          { type: 'divider' },
          {
            key: 'del',
            danger: true,
            icon: <Trash2 size={14} />,
            label: '删除这一张',
            onClick: ({ domEvent }) => {
              domEvent?.stopPropagation?.()
              removeOneFromDeck(deckId, cardId, zone)
            },
          },
        )

        return (
          <ContextMenuTrigger key={sk} items={menuItems}>
            <button
              type="button"
              role="listitem"
              className={`deck-zone-tile${selected ? ' is-selected' : ''}`}
              title={
                card?.name
                  ? `${card.name} · Ctrl+点击多选`
                  : `${cardId} · Ctrl+点击多选`
              }
              onClick={(ev) => handleTileClick(ev, card, sk)}
            >
              <YgoCardThumb
                card={card}
                cardId={cardId}
                imgClassName="deck-zone-tile-img"
                alt={card?.name ? String(card.name) : ''}
              />
              {fav ? (
                <span className="deck-zone-tile-fav" aria-hidden>
                  <Heart size={12} fill="currentColor" />
                </span>
              ) : null}
            </button>
          </ContextMenuTrigger>
        )
      })}
    </div>
  )
}
