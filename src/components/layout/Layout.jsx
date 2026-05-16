import { useMemo, useRef, useEffect } from 'react'
import { Menu, DraggableSideNav, ScrollArea, Icon } from '@lobehub/ui'
import { Home, Search, Settings, Library, Layers, BookOpen } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import useCardStore from '../../store/useStore'
import PersistNavigation from '../navigation/PersistNavigation'
import TitleBar from './TitleBar'
import './Layout.css'

const menuItems = [
  { key: '/', icon: Home, label: '卡牌生成' },
  { key: '/browse', icon: Search, label: '卡牌浏览' },
  { key: '/library', icon: Library, label: '卡牌数据库' },
  { key: '/deck', icon: Layers, label: '我的卡组' },
  { key: '/rules', icon: BookOpen, label: '规则百科' },
]

const bottomMenuItems = [
  { key: '/settings', icon: Settings, label: '设置' },
]

export default function LayoutComponent({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const contentRef = useRef(null)
  const collapsed = useCardStore((s) => s.settings.sidebarCollapsed ?? false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return undefined
    const key = `ygo:routeScroll:${location.pathname}`
    const saved = sessionStorage.getItem(key)
    if (saved != null) {
      const y = parseInt(saved, 10)
      if (!Number.isNaN(y)) {
        requestAnimationFrame(() => {
          el.scrollTop = y
        })
      }
    }

    let idle = null
    const persist = () => {
      if (idle != null) cancelAnimationFrame(idle)
      idle = requestAnimationFrame(() => {
        idle = null
        sessionStorage.setItem(key, String(el.scrollTop))
      })
    }
    el.addEventListener('scroll', persist, { passive: true })
    return () => {
      if (idle != null) cancelAnimationFrame(idle)
      sessionStorage.setItem(key, String(el.scrollTop))
      el.removeEventListener('scroll', persist)
    }
  }, [location.pathname])

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleToggleSidebar = () => {
    useCardStore.getState().setSetting('sidebarCollapsed', !collapsed)
  }

  const primarySelectedKey = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/library')) return '/library'
    if (path.startsWith('/deck')) return '/deck'
    if (path.startsWith('/browse')) return '/browse'
    if (path.startsWith('/rules')) return '/rules'
    if (path === '/') return '/'
    return null
  }, [location.pathname])

  const settingsSelected = useMemo(
    () => location.pathname.startsWith('/settings'),
    [location.pathname],
  )

  const navItems = useMemo(
    () =>
      menuItems.map((item) => ({
        key: item.key,
        icon: <Icon icon={item.icon} />,
        label: item.label,
      })),
    [],
  )

  const settingsItems = useMemo(
    () =>
      bottomMenuItems.map((item) => ({
        key: item.key,
        icon: <Icon icon={item.icon} />,
        label: item.label,
      })),
    [],
  )

  return (
    <>
      <PersistNavigation />
      <div className="app-layout">
        <div className="app-layout-ambience" aria-hidden="true">
          <span className="app-layout-ambience__blob app-layout-ambience__blob--primary" />
          <span className="app-layout-ambience__blob app-layout-ambience__blob--secondary" />
        </div>
        <TitleBar />
        <div className="app-main-shell">
          <div className="app-sidenav-shell">
            <DraggableSideNav
              expand={!collapsed}
              backgroundColor="var(--ygo-nav-bg)"
              classNames={{
                body: 'app-sidenav-body',
                footer: 'app-sidenav-footer',
              }}
              styles={{
                handle: {
                  background: 'var(--ygo-nav-handle-bg)',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  filter: 'none',
                },
              }}
              header={(expand) => (
                <div
                  className={`app-logo-row${expand ? '' : ' app-logo-row--collapsed'}`}
                >
                  <span className="logo-text">YGO</span>
                </div>
              )}
              body={(expand) => (
                <ScrollArea className="app-sidenav-menu-scroll" style={{ height: '100%' }}>
                  <Menu
                    mode="inline"
                    inlineCollapsed={!expand}
                    selectedKeys={primarySelectedKey ? [primarySelectedKey] : []}
                    onClick={handleMenuClick}
                    items={navItems}
                    variant="borderless"
                  />
                </ScrollArea>
              )}
              footer={(expand) => (
                <Menu
                  mode="inline"
                  inlineCollapsed={!expand}
                  selectedKeys={settingsSelected ? ['/settings'] : []}
                  onClick={handleMenuClick}
                  items={settingsItems}
                  variant="borderless"
                />
              )}
              onExpandChange={handleToggleSidebar}
              width={220}
              minWidth={54}
            />
          </div>
          <div className="app-main-inner">
            <main ref={contentRef} className="app-content">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
