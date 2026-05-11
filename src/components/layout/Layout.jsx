import { useMemo, useRef, useEffect } from 'react'
import { Menu } from '@lobehub/ui'
import {
  Home,
  Search,
  Settings,
  Library,
  Layers,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
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

  /** 各路由主内容区滚动位置（切换返回后恢复） */
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

  /** 主导航只应出现「上面一组」的 key；勿把 /settings 等传入 */
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
        icon: <item.icon size={18} />,
        label: item.label,
      })),
    [],
  )

  const settingsItems = useMemo(
    () =>
      bottomMenuItems.map((item) => ({
        key: item.key,
        icon: <item.icon size={18} />,
        label: item.label,
      })),
    [],
  )

  return (
    <>
      <PersistNavigation />
      <div className="app-layout">
        <TitleBar />
        <div className="app-main-shell ant-layout">
          <aside
            className={[
              'app-sider',
              'ant-layout-sider',
              collapsed ? 'ant-layout-sider-collapsed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              width: collapsed ? 72 : 220,
              maxWidth: collapsed ? 72 : 220,
              minWidth: collapsed ? 72 : 220,
            }}
          >
            <div className="ant-layout-sider-children">
              <div className="app-logo-row">
                <span className="logo-text">YGO</span>
                <button
                  type="button"
                  className="sider-pin-btn"
                  onClick={handleToggleSidebar}
                  title={collapsed ? '展开导航' : '折叠导航'}
                  aria-label={collapsed ? '展开导航' : '折叠导航'}
                >
                  {collapsed ? (
                    <PanelLeftOpen size={18} strokeWidth={1.75} />
                  ) : (
                    <PanelLeftClose size={18} strokeWidth={1.75} />
                  )}
                </button>
              </div>
              <div className="sider-body">
                <nav className="sider-nav-primary" aria-label="主导航">
                  <Menu
                    mode="inline"
                    inlineCollapsed={collapsed}
                    selectedKeys={primarySelectedKey ? [primarySelectedKey] : []}
                    onClick={handleMenuClick}
                    items={navItems}
                    className="main-menu"
                  />
                </nav>
                <div className="sider-nav-spacer" aria-hidden="true" />
                <footer className="sider-footer">
                  <Menu
                    mode="inline"
                    inlineCollapsed={collapsed}
                    selectedKeys={settingsSelected ? ['/settings'] : []}
                    onClick={handleMenuClick}
                    items={settingsItems}
                    className="settings-menu"
                  />
                </footer>
              </div>
            </div>
          </aside>
          <div className="app-main-inner ant-layout">
            <main ref={contentRef} className="app-content">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
