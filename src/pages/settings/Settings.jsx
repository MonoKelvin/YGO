import { useState, useEffect } from 'react'
import { Collapse, ThemeSwitch } from '@lobehub/ui'
import { Select, Switch } from '@lobehub/ui/base-ui'
import {
  ExternalLink,
  Heart,
  Palette,
  HardDrive,
  SlidersHorizontal,
  Library,
  Info,
} from 'lucide-react'
import useCardStore from '../../store/useStore'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import { persistUserSettingsToDisk } from '../../utils/persistUserSettings'
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  IS_DEV_BUILD,
} from '../../config/appMeta'
import { AI_DEV_TOOLS } from '../../config/aiDevTools'
import DataDirectorySection from '../../components/settings/DataDirectorySection'
import './Settings.css'

const libraryPageSizeOptions = [10, 20, 30, 50, 100].map((n) => ({
  value: n,
  label: `${n} 张 / 页`,
}))

export default function Settings() {
  const { settings, setSetting } = useCardStore()
  const [localTheme, setLocalTheme] = useState(settings.theme || 'system')
  const [libraryPageSize, setLibraryPageSize] = useState(
    settings.libraryPageSize ?? 20,
  )
  const [autoSave, setAutoSave] = useState(
    settings.autoSave !== undefined ? settings.autoSave : true,
  )
  const [devToolsEnabled, setDevToolsEnabled] = useState(false)

  const electron = typeof window !== 'undefined' ? window.electronAPI : null

  useEffect(() => {
    const checkDevTools = async () => {
      if (!electron?.isDevToolsOpened) return
      const isOpen = await electron.isDevToolsOpened()
      setDevToolsEnabled(isOpen)
    }
    checkDevTools()
  }, [electron])

  useEffect(() => {
    if (!electron?.onDevToolsStateChanged) return undefined
    const unsub = electron.onDevToolsStateChanged((open) => {
      setDevToolsEnabled(!!open)
    })
    return unsub
  }, [electron])

  useEffect(() => {
    setLocalTheme(settings.theme || 'system')
  }, [settings.theme])

  useEffect(() => {
    setLibraryPageSize(settings.libraryPageSize ?? 20)
  }, [settings.libraryPageSize])

  /** ThemeSwitch 使用 antd-style 的 auto / light / dark，应用内持久化为 system / light / dark */
  const handleThemeChange = async (value) => {
    setLocalTheme(value)
    setSetting('theme', value)
    if (electron?.setTheme) {
      await electron.setTheme(value)
    }

    await persistUserSettingsToDisk()
  }

  const handleThemeSwitch = async (mode) => {
    const value = mode === 'auto' ? 'system' : mode
    await handleThemeChange(value)
  }

  const handleAutoSaveChange = async (checked) => {
    setAutoSave(checked)
    setSetting('autoSave', checked)
    await persistUserSettingsToDisk()
  }

  const handleLibraryPageSizeChange = async (value) => {
    setLibraryPageSize(value)
    setSetting('libraryPageSize', value)
    await persistUserSettingsToDisk()
    useYgoDatabaseStore.getState().setFilters({ apiPageSize: value })
    await useYgoDatabaseStore.getState().fetchOnlinePage(1)
  }

  const handleDevToolsToggle = async (checked) => {
    if (!electron?.toggleDevTools || !electron?.isDevToolsOpened) return
    const cur = await electron.isDevToolsOpened()
    if (Boolean(checked) !== Boolean(cur)) {
      await electron.toggleDevTools()
    }
    setDevToolsEnabled(await electron.isDevToolsOpened())
  }

  const collapseItems = []
  collapseItems.push({
    key: 'appearance',
    label: (
      <span className="settings-collapse-label">
        <Palette size={17} strokeWidth={1.75} aria-hidden />
        外观
      </span>
    ),
    children: (
      <div className="settings-collapse-panel">
        <div className="settings-item">
          <label className="settings-label">主题</label>
          <ThemeSwitch
            key={localTheme}
            type="select"
            themeMode={localTheme === 'system' ? 'auto' : localTheme}
            onThemeSwitch={handleThemeSwitch}
            labels={{
              auto: '跟随系统',
              light: '浅色模式',
              dark: '深色模式',
            }}
            className="settings-theme-switch"
          />
        </div>
      </div>
    ),
  })

  if (electron?.getDataRootInfo) {
    collapseItems.push({
      key: 'storage',
      label: (
        <span className="settings-collapse-label">
          <HardDrive size={17} strokeWidth={1.75} aria-hidden />
          存储与数据
        </span>
      ),
      children: (
        <div className="settings-collapse-panel">
          <DataDirectorySection electron={electron} embedInPanel />
        </div>
      ),
    })
  }

  collapseItems.push(
    {
      key: 'general',
      label: (
        <span className="settings-collapse-label">
          <SlidersHorizontal size={17} strokeWidth={1.75} aria-hidden />
          通用
        </span>
      ),
      children: (
        <div className="settings-collapse-panel">
          <div className="settings-item">
            <label className="settings-label">自动保存</label>
            <Switch
              checked={autoSave}
              onChange={handleAutoSaveChange}
            />
          </div>
          {electron?.toggleDevTools && (
            <div className="settings-item">
              <label className="settings-label">开发者工具</label>
              <div className="settings-devtools-hint">
                <Switch
                  checked={devToolsEnabled}
                  onChange={handleDevToolsToggle}
                />
                <span className="settings-hint-text">
                  独立窗口打开；快捷键 Ctrl+Shift+I
                </span>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'library',
      label: (
        <span className="settings-collapse-label">
          <Library size={17} strokeWidth={1.75} aria-hidden />
          卡牌数据库
        </span>
      ),
      children: (
        <div className="settings-collapse-panel">
          <div className="settings-item">
            <label className="settings-label">在线查询每页条数</label>
            <Select
              value={libraryPageSize}
              onChange={handleLibraryPageSizeChange}
              options={libraryPageSizeOptions}
              className="settings-select-wide"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'about',
      label: (
        <span className="settings-collapse-label">
          <Info size={17} strokeWidth={1.75} aria-hidden />
          关于
        </span>
      ),
      children: (
        <div className="settings-collapse-panel settings-about-inner">
          <div className="about-card">
            <div className="about-header">
              <span className="about-app-name">{APP_NAME}</span>
              <span className="about-version">
                v{APP_VERSION}
                {IS_DEV_BUILD && (
                  <span className="about-dev-tag" title="当前为开发构建">
                    {' '}
                    · dev
                  </span>
                )}
              </span>
            </div>
            <p className="about-tagline">{APP_TAGLINE}</p>
            <p className="about-desc">{APP_DESCRIPTION}</p>
            <div className="about-ai-tools">
              <div className="about-ai-tools-title">主要使用的 AI 工具</div>
              <div className="about-ai-tools-links">
                {AI_DEV_TOOLS.map((t) => (
                  <a
                    key={t.id}
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="about-link about-ai-tool-link"
                    title={t.hint}
                  >
                    {t.name}
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ))}
              </div>
              <p className="about-ai-tools-hint">
                Trae / Cursor / DeepSeek
                等链接仅供跳转；具体服务条款以各官网为准。
              </p>
            </div>
            <p className="about-credit">
              卡牌画布排版参考开源项目{' '}
              <a
                href="https://github.com/yamiyang/ygo-card"
                target="_blank"
                rel="noreferrer"
                className="about-link"
              >
                ygo-card
                <ExternalLink size={12} aria-hidden />
              </a>{' '}
              ；相关素材资源位于目录{' '}
              <code className="about-code">assets/Mold</code>。
            </p>
          </div>

          <div className="about-card about-card-muted">
            <h3 className="about-subtitle">开发者</h3>
            <p className="about-muted">
              本项目为爱好者作品，与科乐美（KONAMI）无关联。UI 与功能仍在迭代中。
            </p>
          </div>

          <div className="about-card about-card-muted">
            <h3 className="about-subtitle">
              <Heart size={16} className="about-inline-icon" aria-hidden />
              赞助与支持
            </h3>
            <p className="about-muted">
              若本项目对你有帮助，欢迎通过 Issue / PR 参与改进；赞助渠道可在仓库说明中补充。
            </p>
          </div>
        </div>
      ),
    },
  )

  return (
    <div className="settings-page">
      <h1 className="page-title page-title-settings">设置</h1>
      <Collapse
        variant="ghost"
        gap={12}
        expandIconPlacement="end"
        defaultActiveKey={collapseItems.map((i) => i.key)}
        className="settings-collapse"
        items={collapseItems}
      />
    </div>
  )
}
