import { useState, useEffect } from 'react'
import { Button, Form, ThemeSwitch, Tooltip, toast } from '@lobehub/ui'
import { Select, Switch } from '@lobehub/ui/base-ui'
import {
  ExternalLink,
  Palette,
  HardDrive,
  SlidersHorizontal,
  Library,
  Info,
  FolderInput,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import useCardStore from '../../store/useStore'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import { persistUserSettingsToDisk } from '../../utils/persistUserSettings'
import { openConfirmModal } from '../../utils/openConfirmModal'
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  IS_DEV_BUILD,
} from '../../config/appMeta'
import { AI_DEV_TOOLS } from '../../config/aiDevTools'
import './Settings.css'

const libraryPageSizeOptions = [10, 20, 30, 50, 100].map((n) => ({
  value: n,
  label: `${n} 张 / 页`,
}))

export default function Settings() {
  const { settings, setSetting } = useCardStore()
  const [localTheme, setLocalTheme] = useState(settings.theme || 'system')
  const [libraryPageSize, setLibraryPageSize] = useState(settings.libraryPageSize ?? 20)
  const [autoSave, setAutoSave] = useState(settings.autoSave !== undefined ? settings.autoSave : true)
  const [devToolsEnabled, setDevToolsEnabled] = useState(false)
  const [dataPathInfo, setDataPathInfo] = useState(null)
  const [dataPathBusy, setDataPathBusy] = useState(false)

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

  useEffect(() => {
    const refreshDataPath = async () => {
      if (!electron?.getDataRootInfo) return
      try {
        const r = await electron.getDataRootInfo()
        setDataPathInfo(r)
      } catch (e) {
        console.error(e)
      }
    }
    void refreshDataPath()
  }, [electron])

  const reloadStoresAfterRootChange = async () => {
    await useYgoDatabaseStore.getState().loadLocalDatabase()
    await useYgoDatabaseStore.getState().loadDecks()
  }

  const handleOpenFolder = async () => {
    if (!dataPathInfo?.effectivePath || !electron?.openPathInExplorer) return
    const r = await electron.openPathInExplorer(dataPathInfo.effectivePath)
    if (!r.success) {
      toast.error({
        title: '无法打开目录',
        description: r.error || '未知错误',
      })
    }
  }

  const handlePickMigrate = () => {
    if (!electron?.pickDataDirectory || !electron?.applyDataDirectory) return
    void (async () => {
      const pick = await electron.pickDataDirectory()
      if (pick.canceled || !pick.success || !pick.path) return

      openConfirmModal({
        title: '迁移用户数据',
        width: 520,
        content: (
          <div className="settings-data-migrate-body">
            <p>将把当前用户数据完整复制到所选文件夹，并切换应用的数据目录到该路径。</p>
            <p className="settings-data-migrate-target">
              <span className="settings-data-migrate-label">目标：</span>
              <span className="settings-data-migrate-path">{pick.path}</span>
            </p>
          </div>
        ),
        okText: '开始迁移',
        cancelText: '取消',
        onOk: async () => {
          setDataPathBusy(true)
          try {
            const res = await electron.applyDataDirectory(pick.path)
            if (!res.success) {
              toast.error({
                title: '迁移失败',
                description: res.error || '未知错误',
              })
              return
            }
            if (res.unchanged) {
              toast.info('目录未变化')
              return
            }
            const r = await electron.getDataRootInfo()
            setDataPathInfo(r)
            await reloadStoresAfterRootChange()
            toast.success('数据已迁移并切换到新目录')
          } finally {
            setDataPathBusy(false)
          }
        },
      })
    })()
  }

  const handleResetDefault = () => {
    if (!electron?.resetDataDirectoryDefault) return
    openConfirmModal({
      title: '恢复默认数据目录',
      width: 480,
      content: '将把当前用户数据复制回系统默认用户目录，并清除自定义路径。确定继续？',
      okText: '恢复默认',
      cancelText: '取消',
      onOk: async () => {
        setDataPathBusy(true)
        try {
          const res = await electron.resetDataDirectoryDefault()
          if (!res.success) {
            toast.error({
              title: '操作失败',
              description: res.error || '未知错误',
            })
            return
          }
          if (res.unchanged) {
            toast.info('已在默认目录')
          } else {
            toast.success('已恢复到默认用户数据目录')
          }
          const r = await electron.getDataRootInfo()
          setDataPathInfo(r)
          await reloadStoresAfterRootChange()
        } finally {
          setDataPathBusy(false)
        }
      },
    })
  }

  const handleThemeChange = async (value) => {
    setLocalTheme(value)
    setSetting('theme', value)
    if (electron?.setTheme) {
      await electron.setTheme(value)
    }
    await persistUserSettingsToDisk()
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

  const dataDirHint = '卡组、DIY 卡牌与本地卡库等均保存在此目录；更改后将自动迁移全部文件。'
  const effectivePath = dataPathInfo?.effectivePath || ''
  const showResetDefault = Boolean(dataPathInfo?.customRoot?.trim?.())

  const DataDirectoryLabel = () => (
    <div className="settings-data-label">
      <div className="settings-data-header">
        <span className="settings-data-title">用户数据目录</span>
        <Tooltip title={dataDirHint} placement="topLeft">
          <button
            type="button"
            className="settings-help-trigger"
            aria-label="关于用户数据目录"
          >
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
          </button>
        </Tooltip>
      </div>
      <button
        type="button"
        className="settings-data-path-link"
        title={effectivePath ? `在资源管理器中打开：${effectivePath}` : ''}
        onClick={() => void handleOpenFolder()}
        disabled={!effectivePath || dataPathBusy}
      >
        {effectivePath || '加载中…'}
      </button>
    </div>
  )

  const DataDirectoryControl = () => (
    <div className="settings-data-actions">
      <Button
        size="small"
        icon={<FolderInput size={14} />}
        onClick={handlePickMigrate}
        disabled={dataPathBusy}
      >
        更改目录…
      </Button>
      {showResetDefault && (
        <Button
          size="small"
          icon={<RotateCcw size={14} />}
          onClick={handleResetDefault}
          disabled={dataPathBusy}
        >
          恢复默认
        </Button>
      )}
    </div>
  )

  const items = [
    {
      key: 'appearance',
      icon: Palette,
      title: '外观',
      children: [
        {
          label: '主题',
          desc: '选择应用的显示主题',
          name: 'theme',
          children: (
            <ThemeSwitch
              themeMode={localTheme}
              onThemeSwitch={handleThemeChange}
              type="select"
              variant="outlined"
              labels={{
                auto: '跟随系统',
                dark: '深色模式',
                light: '浅色模式',
              }}
              style={{ minWidth: 150 }}
            />
          ),
        },
      ],
    },
    {
      key: 'general',
      icon: SlidersHorizontal,
      title: '通用',
      children: [
        {
          label: '自动保存',
          desc: '是否自动保存卡牌数据',
          name: 'autoSave',
          children: <Switch checked={autoSave} onChange={handleAutoSaveChange} />,
          valuePropName: 'checked',
        },
        ...(electron?.toggleDevTools
          ? [
              {
                label: '开发者工具',
                desc: '独立窗口打开；快捷键 Ctrl+Shift+I',
                name: 'devTools',
                children: <Switch checked={devToolsEnabled} onChange={handleDevToolsToggle} />,
                valuePropName: 'checked',
              },
            ]
          : []),
      ],
    },
    {
      key: 'storage',
      icon: HardDrive,
      title: '存储与数据',
      children: [
        {
          label: <DataDirectoryLabel />,
          name: 'dataDirectory',
          children: <DataDirectoryControl />,
        },
      ],
    },
    {
      key: 'database',
      icon: Library,
      title: '卡牌数据库',
      children: [
        {
          label: '在线查询每页条数',
          desc: '设置在线API查询时每页显示的卡牌数量',
          name: 'libraryPageSize',
          children: (
            <Select
              options={libraryPageSizeOptions}
              value={libraryPageSize}
              onChange={handleLibraryPageSizeChange}
              style={{ minWidth: 120 }}
              placement="bottomRight"
            />
          ),
        },
      ],
    },
    {
      key: 'about',
      icon: Info,
      title: '关于',
      children: [
        {
          name: 'appInfo',
          children: (
            <div className="about-content">
              <div className="about-header">
                <span className="about-app-name">{APP_NAME}</span>
                <span className="about-version">
                  v{APP_VERSION}
                  {IS_DEV_BUILD && (
                    <span className="about-dev-tag" title="当前为开发构建"> · dev</span>
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
                  Trae / Cursor / DeepSeek 等链接仅供跳转；具体服务条款以各官网为准。
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
                ；相关素材资源位于目录 <code className="about-code">assets/Mold</code>。
              </p>
            </div>
          ),
        },
        {
          label: '开发者',
          name: 'developer',
          children: (
            <p className="about-muted">
              本项目为爱好者作品，与科乐美（KONAMI）无关联。UI 与功能仍在迭代中。
            </p>
          ),
        },
        {
          label: '赞助与支持',
          name: 'sponsor',
          children: (
            <p className="about-muted">
              若本项目对你有帮助，欢迎通过 Issue / PR 参与改进；赞助渠道可在仓库说明中补充。
            </p>
          ),
        },
      ],
    },
  ]

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="page-title">
          <SlidersHorizontal size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          设置
        </h1>
      </div>
      <Form
        items={items}
        collapsible
        variant="outlined"
        layout="horizontal"
        labelAlign="left"
      />
    </div>
  )
}
