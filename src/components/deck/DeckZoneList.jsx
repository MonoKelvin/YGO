/**
 * 卡组分区卡牌列表容器：在 Form 分组内撑满可用宽度。
 */
import DeckZoneTiles from './DeckZoneTiles'
import './DeckZoneList.css'

export default function DeckZoneList(props) {
  return (
    <div className="deck-zone-list">
      <DeckZoneTiles {...props} />
    </div>
  )
}
