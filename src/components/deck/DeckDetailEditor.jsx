import { useMemo, useState, useEffect, useCallback } from 'react'
import { Flexbox, Text, toast, Button, Form } from '@lobehub/ui'
import { openConfirmModal } from '../../utils/openConfirmModal'
import { Layers, Sparkles, PanelRight, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_DECK_NAME,
  isDefaultDeckId,
} from '../../config/deckConstants'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import useCardStore from '../../store/useStore'
import { persistUserSettingsToDisk } from '../../utils/persistUserSettings'
import DeckMetaForm from './DeckMetaForm'
import DeckZoneList from './DeckZoneList'
import { flattenDeckInstances, parseSelectionKey } from './DeckZoneTiles'
import './DeckDetailEditor.css'

const ZONE_LABELS = {
  main: '主卡组',
  extra: '额外卡组',
  side: '副卡组',
}

/** 分区标题右侧：清空该分区卡牌 */
function ZoneClearExtra({ label, onClear }) {
  return (
    <Button
      variant="outlined"
      type="text"
      size="small"
      icon={<Trash2 size={16} />}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClear()
      }}
    />
  )
}

export default function DeckDetailEditor({ deckId }) {
  const navigate = useNavigate()
  const decks = useYgoDatabaseStore((s) => s.decks)
  const updateDeckMeta = useYgoDatabaseStore((s) => s.updateDeckMeta)
  const setDeckNameValidated = useYgoDatabaseStore((s) => s.setDeckNameValidated)
  const removeOneFromDeck = useYgoDatabaseStore((s) => s.removeOneFromDeck)
  const clearDeckZone = useYgoDatabaseStore((s) => s.clearDeckZone)
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

  const confirmClearZone = useCallback(
    (zone) => {
      const zoneLabel = ZONE_LABELS[zone] || zone
      openConfirmModal({
        title: `清空${zoneLabel}？`,
        content: '该分区内的卡牌将被全部移除。',
        okText: '清空',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: () => {
          clearDeckZone(deckId, zone)
          setSelection(new Set())
          toast.success(`已清空${zoneLabel}`)
        },
      })
    },
    [deckId, clearDeckZone],
  )

  if (!deck) return null

  const isDefault = isDefaultDeckId(deckId)

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
    if (isDefault) {
      setNameDraft(DEFAULT_DECK_NAME)
      return
    }
    const trimmed = nameDraft.trim()
    if (trimmed === deck.name) return
    const r = setDeckNameValidated(deckId, trimmed)
    if (!r.ok) {
      toast.warning(r.reason || '名称无效')
      setNameDraft(deck.name)
    }
  }

  const zoneListProps = {
    deckId,
    cardById,
    favoriteSet,
    onToggleFavorite,
    onOpenDetail,
    removeOneFromDeck,
    selection,
    onToggleSelect,
  }

  const zoneFormItems = [
    {
      key: 'main',
      icon: Layers,
      title: `主卡组 · ${mainTotal}/60 · ${mainInstances} 张`,
      extra: (
        <ZoneClearExtra
          label="清空主卡组"
          onClear={() => confirmClearZone('main')}
        />
      ),
      children: (
        <DeckZoneList
          zone="main"
          entries={main}
          shiftMainSide={shiftMainSide}
          {...zoneListProps}
        />
      ),
    },
    {
      key: 'extra',
      icon: Sparkles,
      title: `额外卡组 · ${extraTotal}/15 · ${extraInstances} 张`,
      extra: (
        <ZoneClearExtra
          label="清空额外卡组"
          onClear={() => confirmClearZone('extra')}
        />
      ),
      children: (
        <DeckZoneList zone="extra" entries={extra} {...zoneListProps} />
      ),
    },
    {
      key: 'side',
      icon: PanelRight,
      title: `副卡组 · ${sideTotal}/15 · ${sideInstances} 张`,
      desc: '从主卡组右键「移入副卡组」或原列表操作移入；在此右键移回主卡组。数据库加入的牌默认进主/额外。',
      extra: (
        <ZoneClearExtra
          label="清空副卡组"
          onClear={() => confirmClearZone('side')}
        />
      ),
      children: (
        <DeckZoneList
          zone="side"
          entries={side}
          shiftMainSide={shiftMainSide}
          {...zoneListProps}
        />
      ),
    },
  ]

  return (
    <div className="deck-detail-editor">
      <section className="deck-detail-section deck-meta-section">
        <DeckMetaForm
          name={isDefault ? DEFAULT_DECK_NAME : nameDraft}
          onNameChange={setNameDraft}
          onNameBlur={flushName}
          onNamePressEnter={flushName}
          description={deck.description}
          onDescriptionChange={(v) => handleMeta({ description: v })}
          notes={deck.notes}
          onNotesChange={(v) => handleMeta({ notes: v })}
          showTimestamps
          createdAt={deck.createdAt}
          updatedAt={deck.updatedAt}
          readOnlyName={isDefault}
          nameDesc={isDefault ? '默认卡组名称不可修改' : undefined}
        />
      </section>

      <section className="deck-detail-section deck-zones-section">
        <Text type="secondary" className="deck-zone-hint-keys">
          规则：主卡组最多 60 张、额外 15、副卡组 15；同名卡在主卡组与副卡组合计最多 3
          张（额外卡组内同名亦最多 3 张）。点击卡图打开详情；Ctrl+点击多选；右键快捷操作。
        </Text>

        {selection.size > 0 ? (
          <div className="deck-batch-bar" role="status">
            <Text>
              已选 <strong>{selection.size}</strong> 张
            </Text>
            <Flexbox horizontal gap={8} align="center">
              <Button variant="outlined" danger onClick={confirmBatchRemove}>
                删除所选
              </Button>
              <Button
                variant="outlined"
                type="link"
                onClick={() => setSelection(new Set())}
              >
                取消选择
              </Button>
            </Flexbox>
          </div>
        ) : null}

        <Form
          className="deck-zones-form"
          items={zoneFormItems}
          variant="outlined"
          collapsible
        />
      </section>
    </div>
  )
}
