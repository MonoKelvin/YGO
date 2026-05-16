import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import DeckListPage from './DeckListPage'
import DeckCreatePage from './DeckCreatePage'
import DeckDetailPage from './DeckDetailPage'
import './DeckRoutes.css'

/** 我的卡组子路由：列表与详情 */
export default function DeckRoutes() {
  useEffect(() => {
    void useYgoDatabaseStore.getState().loadDecks()
  }, [])

  return (
    <div className="deck-routes-shell">
      <Routes>
        <Route path="/deck/new" element={<DeckCreatePage />} />
        <Route path="/deck/:deckId" element={<DeckDetailPage />} />
        <Route path="/deck" element={<DeckListPage />} />
      </Routes>
    </div>
  )
}
