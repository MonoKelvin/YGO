import { useNavigate } from 'react-router-dom'
import { Button } from '@lobehub/ui'
import { ArrowLeft, Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DeckCreateForm from '../../components/deck/DeckCreateForm'
import './DeckCreatePage.css'
import './DeckDetailPage.css'

/** 新建卡组：仅填写卡组信息 */
export default function DeckCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="deck-create-page ygo-page-shell ygo-page-shell--detail">
      <PageHeader title="新建卡组" icon={Plus} />

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

      <DeckCreateForm
        onCancel={() => navigate('/deck')}
        onCreated={(deckId) => navigate(`/deck/${deckId}`, { replace: true })}
      />
    </div>
  )
}
