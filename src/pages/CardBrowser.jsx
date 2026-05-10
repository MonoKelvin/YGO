import { useState } from 'react'
import { Input } from '@lobehub/ui'
import { Button, Card, Divider } from 'antd'
import { Search, Delete } from 'lucide-react'
import CardRender from '../components/CardRender'
import useCardStore from '../store/useStore'
import './CardBrowser.css'

export default function CardBrowser() {
  const { cards, deleteCard } = useCardStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)

  const filteredCards = cards.filter(card =>
    card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.race?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.effect?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id, e) => {
    e.stopPropagation()
    deleteCard(id)
    if (selectedCard?.id === id) {
      setSelectedCard(null)
    }
  }

  return (
    <div className="card-browser">
      <div className="card-browser-main">
        <div className="browser-search">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索卡牌..."
            prefix={<Search size={16} />}
          />
        </div>

        <div className="card-browser-list">
          {filteredCards.length === 0 ? (
            <div className="card-browser-empty">
              <p>暂无卡牌</p>
              <p className="empty-hint">在卡牌生成器中创建您的第一张卡牌</p>
            </div>
          ) : (
            <div className="card-list-grid">
              {filteredCards.map(card => (
                <Card
                  key={card.id}
                  hoverable
                  className="card-browser-card"
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="card-list-item">
                    <div className="card-thumb">
                      <span className="card-thumb-text">
                        {card.name?.substring(0, 4) || '???'}
                      </span>
                    </div>
                    <div className="card-info">
                      <h3>{card.name || '未命名'}</h3>
                      <p>{card.race || '未知种族'}</p>
                      <p>
                        {card.cardType === 'monster'
                          ? `${card.attack} / ${card.defense}`
                          : card.cardType === 'spell' ? '魔法卡' : '陷阱卡'}
                      </p>
                    </div>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<Delete size={16} />}
                      onClick={(e) => handleDelete(card.id, e)}
                      className="card-delete-btn"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCard && (
        <div className="card-browser-detail">
          <h2 className="section-title">卡牌详情</h2>
          <CardRender card={selectedCard} />
          <Divider />
          <div className="card-detail-info">
            <h3>{selectedCard.name}</h3>
            <p>{selectedCard.race} · {selectedCard.attribute}</p>
            {selectedCard.cardType === 'monster' && (
              <p>等级 {selectedCard.level} · ATK {selectedCard.attack} / DEF {selectedCard.defense}</p>
            )}
            <Divider style={{ margin: 'var(--spacing-md) 0' }} />
            <p className="card-detail-desc">
              {selectedCard.effect || selectedCard.description || '暂无描述'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
