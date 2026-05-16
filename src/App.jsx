import {
    ConfigProvider,
    ContextMenuHost,
    ModalHost,
    ThemeProvider,
    ToastHost,
} from '@lobehub/ui'
import { motion } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react'

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
import { DEFAULT_LIBRARY_PAGE_SIZE, normalizeLibraryPageSize } from './config/librarySettings'
import { resolveThemePrimaryColor } from './config/lobePrimaryColor'
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

/**
 * PageCache 组件 - 保持所有页面组件的状态
 * 使用 display: none 隐藏非活跃页面，而不是卸载组件
 */
function PageCache() {
    const location = useLocation()
    const cardLibraryRef = useRef(null)
    const deckRoutesRef = useRef(null)

    // 获取当前活跃的页面ID
    const getActivePageId = () => {
        const path = location.pathname
        if (path.startsWith('/library')) return 'library'
        if (path.startsWith('/deck')) return 'deck'
        if (path.startsWith('/browse')) return 'browse'
        if (path.startsWith('/rules')) return 'rules'
        if (path.startsWith('/settings')) return 'settings'
        return 'generator'
    }

    const activePage = getActivePageId()

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '100%' }}>
            {/* 卡牌生成器 */}
            <div
                style={{
                    display: activePage === 'generator' ? 'block' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    minHeight: '100%',
                }}
            >
                <CardGenerator />
            </div>

            {/* 卡牌浏览 */}
            <div
                style={{
                    display: activePage === 'browse' ? 'block' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    minHeight: '100%',
                }}
            >
                <CardBrowser />
            </div>

            {/* 卡牌数据库 */}
            <div
                ref={cardLibraryRef}
                style={{
                    display: activePage === 'library' ? 'block' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    minHeight: '100%',
                }}
            >
                <CardLibrary />
            </div>

            {/* 卡组 */}
            <div
                ref={deckRoutesRef}
                style={{
                    display: activePage === 'deck' ? 'block' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    minHeight: '100%',
                }}
            >
                <DeckRoutes />
            </div>

            {/* 规则百科：占满主内容高度，避免整页 app-content 滚动；内部左右各自 ScrollArea */}
            <div
                style={{
                    display: activePage === 'rules' ? 'flex' : 'none',
                    flexDirection: 'column',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    minHeight: 0,
                    overflow: 'hidden',
                }}
            >
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
            </div>

            {/* 设置 */}
            <div
                style={{
                    display: activePage === 'settings' ? 'block' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    minHeight: '100%',
                }}
            >
                <Settings />
            </div>
        </div>
    )
}

function AppContent() {
    const { resolvedAppearance } = useAppTheme()
    const primaryColorKey = useCardStore((s) => resolveThemePrimaryColor(s.settings.primaryColor))
    const customTheme = useMemo(() => {
        if (primaryColorKey == null) {
            return { neutralColor: 'gray' }
        }
        return { primaryColor: primaryColorKey, neutralColor: 'gray' }
    }, [primaryColorKey])

    /**
     * 统一深浅主题背景 token，避免局部出现纯黑（如 ScrollArea、Modal 容器）。
     * 深色基于 #0b0b0c 向上分层；浅色保持低对比暖灰层级。
     */
    const ygoSurfaceCustomToken = useCallback((theme) => {
        if (theme.isDarkMode) {
            return {
                colorBgBase: '#0f0f10',
                colorBgLayout: '#0a0b0e',
                colorBgContainer: '#14161a',
                colorBgElevated: '#1a1d22',
                colorBgSpotlight: '#22262c',
            }
        }
        return {
            colorBgBase: '#f2f4f8',
            colorBgLayout: '#eef1f6',
            colorBgContainer: '#ffffff',
            colorBgElevated: '#fafbfc',
        }
    }, [])

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

                            const ps = normalizeLibraryPageSize(
                                useCardStore.getState().settings.libraryPageSize ?? DEFAULT_LIBRARY_PAGE_SIZE,
                            )
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
    /** 主色变化时 antd-style 可能未完全重算 token，用 key 强制与 lobe-ui ThemeProvider 行为一致 */
    const themeProviderKey = `${resolvedAppearance}:${primaryColorKey ?? 'default'}`

    return (
        <ThemeProvider
            key={themeProviderKey}
            appearance={resolvedAppearance}
            customTheme={customTheme}
            customToken={ygoSurfaceCustomToken}
        >
            <ToastHost />
            <ModalHost />
            <ContextMenuHost />
            <Layout>
                <PageCache />
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
