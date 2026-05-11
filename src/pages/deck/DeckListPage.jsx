import { useMemo, useState } from 'react'

import { Button, ContextMenuTrigger, Input, Modal, toast } from '@lobehub/ui'
import { Layers, Plus, Pin, Eye, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import PageSpinner from '../../components/common/PageSpinner'
import YgoCardThumb from '../../components/common/YgoCardThumb'
import { openConfirmModal } from '../../utils/openConfirmModal'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'

import './DeckListPage.css'

/** 卡组列表：网格封面、双击进入详情、右键快捷菜单。 */
export default function DeckListPage() {
  const navigate = useNavigate()
  const decks = useYgoDatabaseStore((s) => s.decks)
  const decksLoaded = useYgoDatabaseStore((s) => s.decksLoaded)
  const createDeck = useYgoDatabaseStore((s) => s.createDeck)
  const deleteDeck = useYgoDatabaseStore((s) => s.deleteDeck)
  const toggleDeckPinned = useYgoDatabaseStore((s) => s.toggleDeckPinned)
  const setDeckNameValidated = useYgoDatabaseStore((s) => s.setDeckNameValidated)
  const cardById = useYgoDatabaseStore((s) => s.cardById)

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      const ap = Boolean(a.pinned)
      const bp = Boolean(b.pinned)
      if (ap !== bp) return ap ? -1 : 1
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [decks])

  const handleNew = () => {
    const r = createDeck()
    if (r.ok && r.deckId) navigate(`/deck/${r.deckId}`)
  }

  const openRename = (deck) => {
    setRenameTarget(deck)
    setRenameValue(deck.name)
    setRenameOpen(true)
  }

  const submitRename = () => {
    if (!renameTarget) return
    const r = setDeckNameValidated(renameTarget.id, renameValue)
    if (!r.ok) {
      toast.error(r.reason || '保存失败')
      return
    }
    toast.success('名称已更新')
    setRenameOpen(false)
    setRenameTarget(null)
  }

  const confirmDelete = (deck) => {
    openConfirmModal({
      title: '删除卡组',
      content: `确定删除「${deck.name}」吗？此操作不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteDeck(deck.id)
        toast.success('已删除卡组')
      },
    })
  }

  const buildMenuItems = (deck) => [
    {
      key: 'view',
      label: '查看',
      icon: <Eye size={14} />,
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation?.()
        navigate(`/deck/${deck.id}`)
      },
    },
    {
      key: 'pin',
      label: deck.pinned ? '取消置顶' : '置顶',
      icon: <Pin size={14} />,
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation?.()
        toggleDeckPinned(deck.id)
        toast.success(deck.pinned ? '已取消置顶' : '已置顶')
      },
    },
    {
      key: 'rename',
      label: '编辑名称',
      icon: <Pencil size={14} />,
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation?.()
        openRename(deck)
      },
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      icon: <Trash2 size={14} />,
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation?.()
        confirmDelete(deck)
      },
    },
  ]

  if (!decksLoaded) {
    return (
      <div className="deck-list-loading">
        <PageSpinner tip="加载卡组…" />
      </div>
    )
  }

  return (
    <div className="deck-list-page">
      <header className="deck-list-header">
        <div>
          <h1 className="deck-list-title">
            <Layers size={22} aria-hidden className="deck-list-title-icon" />
            我的卡组
          </h1>
          <p className="deck-list-lead">
            双击卡组进入详情编辑；在「卡牌数据库」可将卡牌加入所选卡组（支持多选批量）。右键卡组可快捷操作。
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleNew}>
          新建卡组
        </Button>
      </header>

      {decks.length === 0 ? (
        <div className="deck-list-empty-state">
          <div className="deck-list-empty-icon-wrap" aria-hidden>
            <Layers className="deck-list-empty-icon" strokeWidth={1.15} />
          </div>
          <p className="deck-list-empty-title">暂无卡组</p>
          <p className="deck-list-empty-hint">
            点击右上角「新建卡组」创建你的第一副卡组
          </p>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleNew}>
            新建卡组
          </Button>
        </div>
      ) : (
        <div className="deck-shelf-grid">
          {sortedDecks.map((deck) => {
            const firstEntry = deck.main?.[0]
            const coverId =
              firstEntry && firstEntry.id != null ? firstEntry.id : null
            const coverCard =
              coverId != null ? cardById(coverId) : null

            return (
              <ContextMenuTrigger key={deck.id} items={buildMenuItems(deck)}>
                <span className="deck-shelf-dropdown-trigger">
                  <button
                    type="button"
                    className="deck-shelf-card"
                    title="双击进入卡组详情 · 右键快捷菜单"
                    onDoubleClick={() => navigate(`/deck/${deck.id}`)}
                  >
                    <div className="deck-shelf-cover-wrap">
                      {deck.pinned && (
                        <span
                          className="deck-shelf-pin-badge"
                          title="已置顶"
                          aria-label="已置顶"
                        >
                          <Pin size={14} strokeWidth={2.25} aria-hidden />
                        </span>
                      )}
                      {coverId != null ? (
                        <YgoCardThumb
                          card={coverCard}
                          cardId={coverId}
                          imgClassName="deck-shelf-cover"
                          alt=""
                        />
                      ) : (
                        <div className="deck-shelf-empty" aria-hidden>
                          空
                        </div>
                      )}
                      <div className="deck-shelf-caption">
                        <span className="deck-shelf-name">{deck.name}</span>
                      </div>
                    </div>
                  </button>
                </span>
              </ContextMenuTrigger>
            )
          })}
        </div>
      )}

      <Modal
        title="编辑卡组名称"
        open={renameOpen}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        onOk={submitRename}
        onCancel={() => {
          setRenameOpen(false)
          setRenameTarget(null)
        }}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          maxLength={80}
          placeholder="卡组名称"
          autoFocus
          onPressEnter={submitRename}
        />
      </Modal>
    </div>
  )
}
