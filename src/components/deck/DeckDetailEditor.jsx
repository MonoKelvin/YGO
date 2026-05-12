import { useMemo, useState, useEffect, useCallback } from 'react'
import { Flexbox, Tag, Text, toast, Button, Input, TextArea } from '@lobehub/ui'
import { openConfirmModal } from '../../utils/openConfirmModal'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import useCardStore from '../../store/useStore'
import { persistUserSettingsToDisk } from '../../utils/persistUserSettings'
import DeckZoneTiles, {
  flattenDeckInstances,
  parseSelectionKey,
} from './DeckZoneTiles'
import './DeckDetailEditor.css'

function fmtTs(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function DeckDetailEditor({ deckId }) {
  const navigate = useNavigate()
  const decks = useYgoDatabaseStore((s) => s.decks)
  const updateDeckMeta = useYgoDatabaseStore((s) => s.updateDeckMeta)
  const setDeckNameValidated = useYgoDatabaseStore((s) => s.setDeckNameValidated)
  const removeOneFromDeck = useYgoDatabaseStore((s) => s.removeOneFromDeck)
  const clearDeckZones = useYgoDatabaseStore((s) => s.clearDeckZones)
  const shiftMainSide = useYgoDatabaseStore((s) => s.shiftMainSide)
  const cardById = useYgoDatabaseStore((s) => s.cardById)

  const favoriteCardIds = useCardStore((s) => s.settings.favoriteCardIds || [])
  const favoriteSet = useMemo(
    () => new Set(favoriteCardIds),
    [favoriteCardIds],
  )
  const toggleFavoriteCardId = useCardStore((s) => s.toggleFavoriteCardId)

  const deck = useMemo(
    () => decks.find((d) => d.id === deckId),
    [decks, deckId],
  )

  const [nameDraft, setNameDraft] = useState('')
  const [selection, setSelection] = useState(() => new Set())

  useEffect(() => {
    if (!deck) return
    setNameDraft(deck.name)
  }, [deckId, deck?.name])

  useEffect(() => {
    setSelection(new Set())
  }, [deckId])

  const onToggleSelect = useCallback((key) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const onOpenDetail = useCallback(
    (card) => {
      navigate(`/library/card/${card.id}`, { state: { card } })
    },
    [navigate],
  )

  const onToggleFavorite = useCallback(
    (id) => {
      toggleFavoriteCardId(id)
      void persistUserSettingsToDisk()
    },
    [toggleFavoriteCardId],
  )

  const confirmBatchRemove = useCallback(() => {
    const n = selection.size
    if (n === 0) return
    openConfirmModal({
      title: `删除选中的 ${n} 张？`,
      content: ' ',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        for (const key of [...selection]) {
          const p = parseSelectionKey(key)
          if (p) removeOneFromDeck(deckId, p.cardId, p.zone)
        }
        setSelection(new Set())
      },
    })
  }, [selection, deckId, removeOneFromDeck])

  if (!deck) return null

  const main = deck.main || []
  const extra = deck.extra || []
  const side = deck.side || []

  const mainTotal = main.reduce((s, e) => s + e.n, 0)
  const extraTotal = extra.reduce((s, e) => s + e.n, 0)
  const sideTotal = side.reduce((s, e) => s + e.n, 0)

  const mainInstances = flattenDeckInstances(main).length
  const extraInstances = flattenDeckInstances(extra).length
  const sideInstances = flattenDeckInstances(side).length

  const handleMeta = (partial) => {
    const r = updateDeckMeta(deckId, partial)
    if (!r.ok && r.reason) toast.warning(r.reason)
  }

  const flushName = () => {
    const trimmed = nameDraft.trim()
    if (trimmed === deck.name) return
    const r = setDeckNameValidated(deckId, trimmed)
    if (!r.ok) {
      toast.warning(r.reason || '名称无效')
      setNameDraft(deck.name)
    }
  }

  const confirmClear = () => {
    openConfirmModal({
      title: '清空该卡组所有卡牌？',
      content: ' ',
      okText: '清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => clearDeckZones(deckId),
    })
  }

  return (
    <div className="deck-detail-editor">
      <section className="deck-meta-card">
        <h4 className="deck-meta-heading">卡组信息</h4>
        <div className="deck-meta-grid">
          <label className="deck-meta-label">
            名称
            <Input
              variant="outlined"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={flushName}
              onPressEnter={flushName}
              placeholder="卡组名称（不可与其他卡组重复）"
              maxLength={80}
            />
          </label>
          <label className="deck-meta-label">
            简介
            <TextArea
              variant="outlined"
              value={deck.description}
              onChange={(e) =>
                handleMeta({ description: e.target.value })
              }
              placeholder="一句话介绍这套卡组"
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={500}
              showCount
            />
          </label>
          <label className="deck-meta-label">
            备注
            <TextArea
              variant="outlined"
              value={deck.notes}
              onChange={(e) => handleMeta({ notes: e.target.value })}
              placeholder="自用备忘、比赛记录等"
              autoSize={{ minRows: 2, maxRows: 8 }}
              maxLength={2000}
              showCount
            />
          </label>
          <div className="deck-meta-readonly">
            <span className="deck-meta-label-text">创建时间</span>
            <Text type="secondary">{fmtTs(deck.createdAt)}</Text>
          </div>
          <div className="deck-meta-readonly">
            <span className="deck-meta-label-text">修改时间</span>
            <Text type="secondary">
              {fmtTs(deck.updatedAt)}（保存卡组时自动更新）
            </Text>
          </div>
        </div>
      </section>

      <section className="deck-zones-section">
        <h4 className="deck-zones-heading">卡组构成</h4>
        <p className="deck-zone-hint-keys">
          规则：主卡组最多 60 张、额外 15、副卡组 15；同名卡在主卡组与副卡组合计最多 3 张（额外卡组内同名亦最多
          3 张）。点击卡图打开详情；Ctrl+点击多选；右键快捷操作。
        </p>

        {selection.size > 0 && (
          <div className="deck-batch-bar">
            <Text>
              已选 <strong>{selection.size}</strong> 张
            </Text>
            <Flexbox horizontal gap={8} align="center">
              <Button variant="outlined" danger onClick={confirmBatchRemove}>
                删除所选
              </Button>
              <Button variant="outlined" type="link" onClick={() => setSelection(new Set())}>
                取消选择
              </Button>
            </Flexbox>
          </div>
        )}

        <div className="deck-zone">
          <div className="deck-zone-title">
            主卡组{' '}
            <Tag>
              {mainTotal}/60 · {mainInstances} 张
            </Tag>
          </div>
          <DeckZoneTiles
            zone="main"
            entries={main}
            deckId={deckId}
            cardById={cardById}
            favoriteSet={favoriteSet}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            removeOneFromDeck={removeOneFromDeck}
            shiftMainSide={shiftMainSide}
            selection={selection}
            onToggleSelect={onToggleSelect}
          />
        </div>

        <div className="deck-zone">
          <div className="deck-zone-title">
            额外卡组{' '}
            <Tag>
              {extraTotal}/15 · {extraInstances} 张
            </Tag>
          </div>
          <DeckZoneTiles
            zone="extra"
            entries={extra}
            deckId={deckId}
            cardById={cardById}
            favoriteSet={favoriteSet}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            removeOneFromDeck={removeOneFromDeck}
            selection={selection}
            onToggleSelect={onToggleSelect}
          />
        </div>

        <div className="deck-zone">
          <div className="deck-zone-title">
            副卡组（Side）{' '}
            <Tag>
              {sideTotal}/15 · {sideInstances} 张
            </Tag>
          </div>
          <p className="deck-zone-hint">
            从主卡组右键「移入副卡组」或原列表操作移入；在此右键移回主卡组。数据库加入的牌默认进主/额外。
          </p>
          <DeckZoneTiles
            zone="side"
            entries={side}
            deckId={deckId}
            cardById={cardById}
            favoriteSet={favoriteSet}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            removeOneFromDeck={removeOneFromDeck}
            shiftMainSide={shiftMainSide}
            selection={selection}
            onToggleSelect={onToggleSelect}
          />
        </div>

        <Button variant="outlined" danger icon={<Trash2 size={16} />} onClick={confirmClear} block>
          清空该卡组全部卡牌
        </Button>
      </section>
    </div>
  )
}
