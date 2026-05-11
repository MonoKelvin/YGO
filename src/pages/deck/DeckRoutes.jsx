import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'

export default function DeckRoutes() {
  useEffect(() => {
    void useYgoDatabaseStore.getState().loadDecks()
  }, [])

  return <Outlet />
}
