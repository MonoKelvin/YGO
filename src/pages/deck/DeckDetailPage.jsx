import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast, Button } from '@lobehub/ui'
import PageSpinner from '../../components/common/PageSpinner'
import { openConfirmModal } from '../../utils/openConfirmModal'
import { ArrowLeft, Trash2, Layers } from 'lucide-react'
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

  const deck = decks.find((d) => d.id === deckId)

  useEffect(() => {
    if (deckId) setLastActiveDeckId(deckId)
  }, [deckId, setLastActiveDeckId])

  useEffect(() => {
    if (!decksLoaded || !deckId) return
    if (!decks.some((d) => d.id === deckId)) {
      navigate('/deck', { replace: true })
    }
  }, [decksLoaded, decks, deckId, navigate])

  const handleDelete = () => {
    openConfirmModal({
      title: '删除该卡组？',
      content: '删除后不可恢复（卡牌清单将一并删除）。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteDeck(deckId)
        navigate('/deck')
        toast.success('已删除卡组')
      },
    })
  }

  if (!decksLoaded) {
    return (
      <div className="deck-detail-page">
        <div className="page-header">
          <h1 className="page-title">
            <Layers size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            卡组详情
          </h1>
        </div>
        <div className="deck-detail-loading">
          <PageSpinner tip="加载卡组…" />
        </div>
      </div>
    )
  }

  if (!deck) {
    return null
  }

  return (
    <div className="deck-detail-page">
      <div className="page-header">
        <h1 className="page-title">
          <Layers size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          {deck.name}
        </h1>
        <Button
          variant="outlined"
          danger
          type="text"
          icon={<Trash2 size={16} />}
          onClick={handleDelete}
        >
          删除卡组
        </Button>
      </div>

      <Button
        variant="outlined"
        type="text"
        icon={<ArrowLeft size={18} />}
        onClick={() => navigate('/deck')}
        style={{ marginBottom: 16 }}
      >
        返回卡组列表
      </Button>

      <DeckDetailEditor deckId={deckId} />
    </div>
  )
}
