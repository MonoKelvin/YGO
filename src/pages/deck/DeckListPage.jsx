import { useMemo, useState } from 'react'
import {
  ContextMenuTrigger,
  Modal,
  toast,
  Button,
  Input,
  SearchBar,
  Flexbox,
} from '@lobehub/ui'
import {
  Layers,
  Plus,
  Pin,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../../components/layout/PageHeader'
import PageSpinner from '../../components/common/PageSpinner'
import DeckListSortMenu from '../../components/deck/DeckListSortMenu'
import YgoCardThumb from '../../components/common/YgoCardThumb'
import { isDefaultDeckId, isDeckVisibleInList } from '../../config/deckConstants'
import { openConfirmModal } from '../../utils/openConfirmModal'
import {
  DEFAULT_DECK_LIST_SORT_KEY,
  filterDecksBySearchQuery,
  sortDecksForList,
} from '../../utils/deckListSort'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'

import './DeckListPage.css'

export default function DeckListPage() {
  const navigate = useNavigate()
  const decks = useYgoDatabaseStore((s) => s.decks)
  const decksLoaded = useYgoDatabaseStore((s) => s.decksLoaded)
  const deleteDeck = useYgoDatabaseStore((s) => s.deleteDeck)
  const toggleDeckPinned = useYgoDatabaseStore((s) => s.toggleDeckPinned)
  const setDeckNameValidated = useYgoDatabaseStore((s) => s.setDeckNameValidated)
  const cardById = useYgoDatabaseStore((s) => s.cardById)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState(DEFAULT_DECK_LIST_SORT_KEY)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const visibleDecks = useMemo(() => {
    const base = decks.filter(isDeckVisibleInList)
    const filtered = filterDecksBySearchQuery(base, searchQuery)
    return sortDecksForList(filtered, sortKey)
  }, [decks, searchQuery, sortKey])

  const handleNew = () => {
    navigate('/deck/new')
  }

  const openRename = (deck) => {
    if (isDefaultDeckId(deck.id)) {
      toast.warning('默认卡组不可重命名')
      return
    }
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
    if (isDefaultDeckId(deck.id)) {
      toast.warning('默认卡组不可删除')
      return
    }
    openConfirmModal({
      title: '删除卡组',
      content: `确定删除「${deck.name}」吗？此操作不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const r = deleteDeck(deck.id)
        if (r?.ok === false) {
          toast.error(r.reason || '无法删除')
          return
        }
        toast.success('已删除卡组')
      },
    })
  }

  const buildMenuItems = (deck) => {
    const items = [
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
    ]
    if (!isDefaultDeckId(deck.id)) {
      items.push(
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
      )
    }
    return items
  }

  const headerLead =
    '默认卡组始终保留在首位；双击进入详情，右键快捷操作。支持搜索名称、简介与备注。'

  if (!decksLoaded) {
    return (
      <div className="deck-list-page ygo-page-shell">
        <PageHeader title="我的卡组" icon={Layers} />
        <div className="deck-list-loading">
          <PageSpinner tip="加载卡组…" />
        </div>
      </div>
    )
  }

  return (
    <div className="deck-list-page ygo-page-shell">
      <PageHeader
        title="我的卡组"
        icon={Layers}
        lead={headerLead}
        className="deck-list-page-header"
      />

      <div className="deck-list-toolbar">
        <div className="deck-list-search">
          <SearchBar
            variant="outlined"
            value={searchQuery}
            onInputChange={setSearchQuery}
            placeholder="搜索卡组名称、简介、备注…"
            allowClear
            enableShortKey
            shortKey="f"
          />
        </div>
        <Flexbox
          horizontal
          gap={8}
          align="center"
          className="deck-list-toolbar-actions"
        >
          <DeckListSortMenu value={sortKey} onChange={setSortKey} />
          <Button
            variant="outlined"
            type="primary"
            className="deck-list-toolbar-btn"
            icon={<Plus size={16} />}
            onClick={handleNew}
          >
            新建卡组
          </Button>
        </Flexbox>
      </div>

      {visibleDecks.length === 0 ? (
        <p className="deck-list-empty-hint">
          {decks.filter(isDeckVisibleInList).length === 0
            ? '暂无卡组'
            : '没有匹配的卡组，请调整搜索条件'}
        </p>
      ) : (
        <div className="deck-shelf-grid">
          {visibleDecks.map((deck) => {
            const isDefault = isDefaultDeckId(deck.id)
            const firstEntry = deck.main?.[0]
            const coverId =
              firstEntry && firstEntry.id != null ? firstEntry.id : null
            const coverCard = coverId != null ? cardById(coverId) : null

            return (
              <ContextMenuTrigger key={deck.id} items={buildMenuItems(deck)}>
                <span className="deck-shelf-dropdown-trigger">
                  <button
                    type="button"
                    className={`deck-shelf-card${isDefault ? ' deck-shelf-card--default' : ''}`}
                    title={
                      isDefault
                        ? '默认卡组 · 双击进入详情 · 右键快捷菜单'
                        : '双击进入卡组详情 · 右键快捷菜单'
                    }
                    aria-label={isDefault ? '默认卡组' : deck.name}
                    onDoubleClick={() => navigate(`/deck/${deck.id}`)}
                  >
                    <div className="deck-shelf-cover-wrap">
                      {deck.pinned && !isDefault ? (
                        <span
                          className="deck-shelf-pin-badge"
                          title="已置顶"
                          aria-label="已置顶"
                        >
                          <Pin size={14} strokeWidth={2.25} aria-hidden />
                        </span>
                      ) : null}
                      {coverId != null ? (
                        <YgoCardThumb
                          card={coverCard}
                          cardId={coverId}
                          imgClassName="deck-shelf-cover"
                          alt=""
                        />
                      ) : isDefault ? (
                        <span
                          className="deck-shelf-placeholder deck-shelf-placeholder--default"
                          aria-hidden
                        >
                          默认
                        </span>
                      ) : (
                        <span className="deck-shelf-placeholder" aria-hidden>
                          空
                        </span>
                      )}
                      {!isDefault ? (
                        <div className="deck-shelf-caption">
                          <span className="deck-shelf-name">{deck.name}</span>
                        </div>
                      ) : null}
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
          variant="outlined"
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
