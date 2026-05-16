import { useCallback, useMemo, useState } from 'react'
import { Button, Dropdown, Flexbox, Menu, ScrollArea, SearchBar, Text, toast } from '@lobehub/ui'
import { Edit3, FolderOpen, Images, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useCardStore from '../../store/useStore'
import { openCardIllustrationLocation } from '../../utils/cardIllustrationActions'
import { openConfirmModal } from '../../utils/openConfirmModal'
import CardBrowserThumb from './CardBrowserThumb'
import {
  cardHasRevealableImage,
  getCardBrowserStatsLine,
  getCardBrowserSubtitle,
} from './cardBrowserHelpers'
import './CardBrowser.css'

export default function CardBrowser() {
  const navigate = useNavigate()
  const cards = useCardStore((s) => s.cards)
  const deleteCard = useCardStore((s) => s.deleteCard)
  const loadCardIntoGenerator = useCardStore((s) => s.loadCardIntoGenerator)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.race?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.effect?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [cards, searchTerm],
  )

  const loadToEditor = useCallback(
    (card) => {
      loadCardIntoGenerator(card)
      navigate('/')
    },
    [loadCardIntoGenerator, navigate],
  )

  const confirmDelete = useCallback(
    (card) => {
      const name = card.name || '未命名'
      openConfirmModal({
        title: '删除卡牌',
        content: `确定从浏览列表中删除「${name}」吗？已保存的 PNG 文件不会自动删除。`,
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: () => {
          deleteCard(card.id)
          toast.success('已删除')
        },
      })
    },
    [deleteCard],
  )

  const buildMenuItems = useCallback(
    (card) => {
      const items = [
        {
          key: 'edit',
          label: '载入编辑',
          icon: <Edit3 size={14} />,
          onClick: ({ domEvent }) => {
            domEvent?.stopPropagation?.()
            loadToEditor(card)
          },
        },
      ]

      if (cardHasRevealableImage(card)) {
        items.push({
          key: 'reveal',
          label: '打开图片位置',
          icon: <FolderOpen size={14} />,
          onClick: ({ domEvent }) => {
            domEvent?.stopPropagation?.()
            void openCardIllustrationLocation({
              displayPath: card.imageDisplayPath,
              imagePath: card.imagePath,
            })
          },
        })
      }

      items.push(
        { type: 'divider' },
        {
          key: 'delete',
          label: '删除',
          danger: true,
          icon: <Trash2 size={14} />,
          onClick: ({ domEvent }) => {
            domEvent?.stopPropagation?.()
            confirmDelete(card)
          },
        },
      )

      return items
    },
    [confirmDelete, loadToEditor],
  )

  const countLabel =
    filteredCards.length === cards.length
      ? `共 ${cards.length} 张`
      : `显示 ${filteredCards.length} / ${cards.length} 张`

  return (
    <Flexbox className="card-browser" vertical flex={1} style={{ minHeight: 0 }}>
      <header className="card-browser-header">
        <Flexbox
          horizontal
          align="flex-end"
          justify="space-between"
          wrap="wrap"
          gap={16}
          className="card-browser-header-row"
        >
          <Flexbox vertical gap={6} flex={1} style={{ minWidth: 200 }}>
            <h1 className="page-title card-browser-title">
              <Images size={22} className="card-browser-title-icon" aria-hidden />
              卡牌浏览
            </h1>
            <Text type="secondary" className="card-browser-lead">
              {countLabel} · 右键卡牌载入编辑、打开图片或删除
            </Text>
          </Flexbox>
          <div className="card-browser-search">
            <SearchBar
              variant="outlined"
              value={searchTerm}
              onInputChange={setSearchTerm}
              placeholder="搜索名称、种族或效果…"
              allowClear
            />
          </div>
        </Flexbox>
      </header>

      <ScrollArea className="card-browser-scroll">
        <div className="card-browser-scroll-inner">
          {filteredCards.length === 0 ? (
            <Flexbox
              vertical
              align="center"
              justify="center"
              gap={12}
              className="card-browser-empty"
            >
              <div className="card-browser-empty-icon-wrap" aria-hidden>
                <Images className="card-browser-empty-icon" strokeWidth={1.15} />
              </div>
              <Text strong className="card-browser-empty-title">
                {cards.length === 0 ? '暂无卡牌' : '无匹配结果'}
              </Text>
              <Text type="secondary" className="card-browser-empty-hint">
                {cards.length === 0
                  ? '在卡牌生成器中保存后，会出现在这里'
                  : '尝试更换关键词或清空搜索'}
              </Text>
              {cards.length === 0 ? (
                <Button variant="outlined" type="primary" onClick={() => navigate('/')}>
                  前往生成器
                </Button>
              ) : null}
            </Flexbox>
          ) : (
            <div className="card-browser-grid" role="list">
              {filteredCards.map((card) => {
                const menuItems = buildMenuItems(card)
                return (
                  <Dropdown
                    key={card.id}
                    trigger={['contextMenu']}
                    menu={{ items: menuItems }}
                    popupRender={() => (
                      <Menu variant="outlined" shadow items={menuItems} />
                    )}
                  >
                    <span className="card-browser-menu-trigger" role="listitem">
                      <button
                        type="button"
                        className="card-browser-tile"
                        title={`${card.name || '未命名'} · 右键菜单`}
                      >
                        <CardBrowserThumb card={card} />
                        <div className="card-browser-tile-foot">
                          <span className="card-browser-tile-name">
                            {card.name || '未命名'}
                          </span>
                          <span className="card-browser-tile-meta">
                            {getCardBrowserSubtitle(card)}
                            {' · '}
                            {getCardBrowserStatsLine(card)}
                          </span>
                        </div>
                      </button>
                    </span>
                  </Dropdown>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </Flexbox>
  )
}
