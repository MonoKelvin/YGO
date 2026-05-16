import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast, Button, Flexbox } from '@lobehub/ui'
import PageSpinner from '../../components/common/PageSpinner'
import { isDefaultDeckId } from '../../config/deckConstants'
import { openConfirmModal } from '../../utils/openConfirmModal'
import { ArrowLeft, Copy, Trash2, Layers } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DeckDetailEditor from '../../components/deck/DeckDetailEditor'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import './DeckDetailPage.css'

export default function DeckDetailPage() {
  const { deckId } = useParams()
  const navigate = useNavigate()
  const decks = useYgoDatabaseStore((s) => s.decks)
  const decksLoaded = useYgoDatabaseStore((s) => s.decksLoaded)
  const setLastActiveDeckId = useYgoDatabaseStore((s) => s.setLastActiveDeckId)
  const deleteDeck = useYgoDatabaseStore((s) => s.deleteDeck)
  const duplicateDeck = useYgoDatabaseStore((s) => s.duplicateDeck)

  const deck = decks.find((d) => d.id === deckId)
  const canDelete = deckId && !isDefaultDeckId(deckId)

  useEffect(() => {
    if (deckId) setLastActiveDeckId(deckId)
  }, [deckId, setLastActiveDeckId])

  useEffect(() => {
    if (deckId === 'new') {
      navigate('/deck/new', { replace: true })
      return
    }
    if (!decksLoaded || !deckId) return
    if (!decks.some((d) => d.id === deckId)) {
      navigate('/deck', { replace: true })
    }
  }, [decksLoaded, decks, deckId, navigate])

  const handleDelete = () => {
    if (!canDelete) {
      toast.warning('默认卡组不可删除')
      return
    }
    openConfirmModal({
      title: '删除该卡组？',
      content: '删除后不可恢复（卡牌清单将一并删除）。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const r = deleteDeck(deckId)
        if (r?.ok === false) {
          toast.error(r.reason || '无法删除')
          return
        }
        navigate('/deck')
        toast.success('已删除卡组')
      },
    })
  }

  const handleDuplicate = () => {
    const r = duplicateDeck(deckId)
    if (!r.ok) {
      toast.error(r.reason || '复制失败')
      return
    }
    toast.success('已复制卡组')
    if (r.deckId) navigate(`/deck/${r.deckId}`)
  }

  if (!decksLoaded) {
    return (
      <div className="deck-detail-page ygo-page-shell ygo-page-shell--detail">
        <PageHeader title="卡组详情" icon={Layers} />
        <div className="deck-detail-loading">
          <PageSpinner tip="加载卡组…" />
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="deck-detail-page ygo-page-shell ygo-page-shell--detail">
        <div className="deck-detail-loading">
          <PageSpinner tip="加载卡组…" />
        </div>
      </div>
    )
  }

  return (
    <div className="deck-detail-page ygo-page-shell ygo-page-shell--detail">
      <PageHeader title={deck.name} icon={Layers} />

      <div className="deck-detail-toolbar">
        <Button
          type="text"
          variant="outlined"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/deck')}
          className="deck-detail-back"
        >
          返回
        </Button>
      </div>

      <DeckDetailEditor deckId={deckId} />

      <div className="deck-detail-footer">
        <Flexbox horizontal gap={12} justify="flex-end" wrap="wrap">
          <Button
            variant="outlined"
            icon={<Copy size={16} />}
            onClick={handleDuplicate}
          >
            复制卡组
          </Button>
          {canDelete ? (
            <Button
              type="primary"
              danger
              icon={<Trash2 size={16} />}
              onClick={handleDelete}
            >
              删除卡组
            </Button>
          ) : null}
        </Flexbox>
      </div>
    </div>
  )
}
