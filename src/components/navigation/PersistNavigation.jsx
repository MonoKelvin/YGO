import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useCardStore from '../../store/useStore'

function isValidStoredRoute(fullPath) {
  if (typeof fullPath !== 'string' || !fullPath.startsWith('/')) return false
  const pathOnly = fullPath.split('?')[0]
  if (pathOnly === '/') return true
  if (pathOnly === '/browse') return true
  if (pathOnly.startsWith('/library')) return true
  if (pathOnly.startsWith('/deck')) return true
  if (pathOnly === '/rules') return true
  if (pathOnly === '/settings') return true
  return false
}

/**
 * 首次启动按上次保存的路由恢复；之后路由变化写回 settings.lastRoute。
 * 恢复逻辑只依赖「本组件首次渲染时的 URL」，避免 pathname 变化反复触发 effect 与手动导航打架。
 */
export default function PersistNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const skipFirstPersist = useRef(true)
  const routeRestoreDoneRef = useRef(false)
  const initialEntryRef = useRef(null)
  if (initialEntryRef.current === null) {
    initialEntryRef.current = `${location.pathname}${location.search}`
  }

  useLayoutEffect(() => {
    if (routeRestoreDoneRef.current) return
    routeRestoreDoneRef.current = true

    const raw = useCardStore.getState().settings.lastRoute
    const target =
      typeof raw === 'string' && isValidStoredRoute(raw) ? raw : '/'

    const current = initialEntryRef.current
    if (current !== target) navigate(target, { replace: true })
  }, [navigate])

  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false
      return
    }
    const path = location.pathname + location.search
    useCardStore.getState().setSetting('lastRoute', path)
  }, [location.pathname, location.search])

  return null
}
