import {
  ConfigProvider,
  ContextMenuHost,
  ModalHost,
  ThemeProvider,
  ToastHost,
} from '@lobehub/ui'
import { motion } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'

import CardGenerator from './pages/card-generator/CardGenerator'
import CardBrowser from './pages/card-browser/CardBrowser'
import CardLibrary from './pages/card-library/CardLibrary'
import CardDetail from './pages/card-library/CardDetail'
import DeckRoutes from './pages/deck/DeckRoutes'
import DeckListPage from './pages/deck/DeckListPage'
import DeckDetailPage from './pages/deck/DeckDetailPage'
import Settings from './pages/settings/Settings'
import Layout from './components/layout/Layout'
import RouteErrorBoundary from './components/common/RouteErrorBoundary'
import useCardStore from './store/useStore'
import useYgoDatabaseStore from './store/useYgoDatabaseStore'
import { pickPersistedSettings } from './utils/pickPersistedSettings'
import { subscribeDebouncedSettingsPersist } from './utils/subscribeDebouncedSettingsPersist'
import { useAppTheme } from './theme'

/** 规则百科 chunk 加载失败时的占位 UI（懒加载 catch 分支返回）。 */
function RulesWikiLoadFailed() {
  return (
    <div className="route-error-boundary">
      <p className="route-error-boundary-title">规则百科脚本加载失败</p>
      <p className="route-error-boundary-detail">
        请查看控制台错误信息，或重启应用后再试。
      </p>
    </div>
  )
}

const RulesWiki = lazy(async () => {
  try {
    return await import('./pages/rules/RulesWiki')
  } catch (err) {
    console.error('[RulesWiki] chunk load failed', err)
    return { default: RulesWikiLoadFailed }
  }
})

/** 启动阶段占位：占满 #root flex 子项，避免无子节点时整页像「空白」。样式内联，因 Layout 尚未挂载、Layout.css 可能未加载。 */
function BootstrapPlaceholder() {
  return (
    <div
      style={{
        flex: '1 1 auto',
        minHeight: 0,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-primary)',
      }}
      role="status"
      aria-live="polite"
      aria-label="正在加载设置"
    >
      <Loader2 className="ygo-spin" size={40} aria-hidden />
    </div>
  )
}

function AppContent() {
  const { resolvedAppearance } = useAppTheme()
  const [initialized, setInitialized] = useState(false)

  // 从 Electron 读回持久化设置并同步到 Zustand；超时仍解锁 UI。安全定时器防止极端情况下 finally 未执行导致一直占位。
  useEffect(() => {
    const INIT_MS = 8000
    const SAFETY_MS = 12000
    let cancelled = false
    let safetyTimer = window.setTimeout(() => {
      if (!cancelled) setInitialized(true)
    }, SAFETY_MS)

    const bootstrap = async () => {
      const electron =
        typeof window !== 'undefined' ? window.electronAPI : undefined
      try {
        if (electron?.readUserSettings) {
          await Promise.race([
            (async () => {
              const storedSettings = await electron.readUserSettings()
              const stored = storedSettings.data || {}

              useCardStore.getState().hydrateSettings(pickPersistedSettings(stored))

              const ps = useCardStore.getState().settings.libraryPageSize ?? 20
              useYgoDatabaseStore.getState().setFilters({ apiPageSize: ps })
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('settings init timeout')), INIT_MS),
            ),
          ])
        }
      } catch (error) {
        console.error('Failed to initialize settings:', error)
      } finally {
        window.clearTimeout(safetyTimer)
        if (!cancelled) setInitialized(true)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      window.clearTimeout(safetyTimer)
    }
  }, [])

  useEffect(() => {
    if (!initialized) return undefined
    return subscribeDebouncedSettingsPersist()
  }, [initialized])

  if (!initialized) {
    return <BootstrapPlaceholder />
  }

  /**
   * ThemeProvider：Lobe 主题。
   * ToastHost / ModalHost / ContextMenuHost：全局 toast、栈式 Modal、右键菜单 portal。
   */
  return (
    <ThemeProvider appearance={resolvedAppearance}>
      <ToastHost />
      <ModalHost />
      <ContextMenuHost />
      <Layout>
        <Routes>
          <Route path="/" element={<CardGenerator />} />
          <Route path="/browse" element={<CardBrowser />} />
          <Route path="/library" element={<CardLibrary />} />
          <Route path="/library/card/:id" element={<CardDetail />} />
          <Route path="/deck" element={<DeckRoutes />}>
            <Route index element={<DeckListPage />} />
            <Route path=":deckId" element={<DeckDetailPage />} />
          </Route>
          <Route
            path="/rules"
            element={
              <RouteErrorBoundary title="规则百科暂时无法打开">
                <Suspense
                  fallback={
                    <div className="app-route-suspense" role="status">
                      <Loader2 className="ygo-spin" size={40} aria-hidden />
                    </div>
                  }
                >
                  <RulesWiki />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  )
}

function App() {
  return (
    <RouteErrorBoundary title="应用界面渲染失败">
      <ConfigProvider motion={motion} locale="zh-CN">
        <AppContent />
      </ConfigProvider>
    </RouteErrorBoundary>
  )
}

export default App
