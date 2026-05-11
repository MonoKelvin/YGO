import { useState } from 'react'
import { Block, Button, SearchBar } from '@lobehub/ui'
import { Delete, Edit3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CardPreview from '../../components/card-preview'
import useCardStore from '../../store/useStore'
import {
  ATTRIBUTES,
  labelFromOptions,
  SPELL_CARD_TYPES,
  TRAP_CARD_TYPES,
  normalizeCard,
} from '../../config/cardConstants'
import './CardBrowser.css'

export default function CardBrowser() {
  const navigate = useNavigate()
  const { cards, deleteCard, setCurrentCard } = useCardStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)

  const filteredCards = cards.filter(
    (card) =>
      card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.race?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.effect?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (id, e) => {
    e.stopPropagation()
    deleteCard(id)
    if (selectedCard?.id === id) {
      setSelectedCard(null)
    }
  }

  const handleLoadToEditor = () => {
    if (!selectedCard) return
    setCurrentCard(normalizeCard(selectedCard))
    navigate('/')
  }

  return (
    <div className="card-browser">
      <div className="card-browser-main">
        <div className="browser-search">
          <SearchBar
            value={searchTerm}
            onInputChange={setSearchTerm}
            placeholder="搜索卡牌..."
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
              {filteredCards.map((card) => (
                <Block
                  key={card.id}
                  clickable
                  variant="outlined"
                  className="card-browser-card"
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="card-list-item">
                    <div className="card-thumb card-thumb-preview-wrap">
                      <CardPreview card={card} />
                    </div>
                    <div className="card-info">
                      <h3>{card.name || '未命名'}</h3>
                      <p>
                        {card.cardType === 'monster'
                          ? card.race || '怪兽'
                          : card.cardType === 'spell'
                            ? labelFromOptions(SPELL_CARD_TYPES, card.spellType)
                            : labelFromOptions(TRAP_CARD_TYPES, card.trapType)}
                      </p>
                      <p>
                        {card.cardType === 'monster'
                          ? `${card.attack} / ${card.defense}`
                          : card.cardType === 'spell'
                            ? '魔法卡'
                            : '陷阱卡'}
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
                </Block>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCard && (
        <div className="card-browser-detail">
          <h2 className="section-title">卡牌详情</h2>
          <CardPreview card={selectedCard} />
          <div className="card-detail-actions">
            <Button type="primary" icon={<Edit3 size={16} />} onClick={handleLoadToEditor}>
              载入编辑
            </Button>
          </div>
          <hr className="card-browser-divider" />
          <div className="card-detail-info">
            <h3>{selectedCard.name}</h3>
            {selectedCard.cardType === 'monster' && (
              <p>
                {selectedCard.race || '种族未填'} ·{' '}
                {labelFromOptions(ATTRIBUTES, selectedCard.attribute)}
              </p>
            )}
            {selectedCard.cardType === 'spell' && (
              <p>{labelFromOptions(SPELL_CARD_TYPES, selectedCard.spellType)}</p>
            )}
            {selectedCard.cardType === 'trap' && (
              <p>{labelFromOptions(TRAP_CARD_TYPES, selectedCard.trapType)}</p>
            )}
            {selectedCard.cardType === 'monster' && (
              <p>
                等级 {selectedCard.level} · ATK {selectedCard.attack} / DEF{' '}
                {selectedCard.defense}
              </p>
            )}
            <hr
              className="card-browser-divider"
              style={{ margin: 'var(--spacing-md) 0' }}
            />
            <p className="card-detail-desc">
              {selectedCard.effect || selectedCard.description || '暂无描述'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
