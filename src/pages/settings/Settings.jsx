import { useState, useEffect } from 'react'
import { Form, primaryColors } from '@lobehub/ui'
import { Palette, SlidersHorizontal, HardDrive, Library, Info } from 'lucide-react'
import useCardStore from '../../store/useStore'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import { persistUserSettingsToDisk } from '../../utils/persistUserSettings'
import {
    LOBE_PRIMARY_COLOR_KEYS,
    LOBE_PRIMARY_SWATCH_DEFAULT,
} from '../../config/lobePrimaryColor'
import {
    DEFAULT_LIBRARY_PAGE_SIZE,
    normalizeLibraryPageSize,
} from '../../config/librarySettings'
import {
    AppearanceSection,
    GeneralSection,
    StorageSection,
    DatabaseSection,
    AboutSection,
} from '../../components/settings/sections'
import './Settings.css'

export default function Settings() {
    const { settings, setSetting } = useCardStore()
    const [localTheme, setLocalTheme] = useState(settings.theme === 'system' ? 'auto' : settings.theme || 'auto')
    const [devToolsEnabled, setDevToolsEnabled] = useState(false)

    const electron = typeof window !== 'undefined' ? window.electronAPI : null

    // 监听开发者工具状态
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

    // 同步主题设置到本地状态
    useEffect(() => {
        setLocalTheme(settings.theme === 'system' ? 'auto' : settings.theme || 'auto')
    }, [settings.theme])

    // 处理主题变更
    const handleThemeChange = async (value) => {
        setLocalTheme(value)
        const themeValue = value === 'auto' ? 'system' : value
        setSetting('theme', themeValue)
        if (electron?.setTheme) {
            await electron.setTheme(themeValue)
        }
        await persistUserSettingsToDisk()
    }

    /** 与 @lobehub/ui primaryColors 实际 hex 对齐，勿把蓝色误判为「默认」 */
    const handlePrimaryColorChange = (color) => {
        if (
            color == null ||
            color === '' ||
            color === LOBE_PRIMARY_SWATCH_DEFAULT ||
            color === 'transparent'
        ) {
            setSetting('primaryColor', null)
            void persistUserSettingsToDisk()
            return
        }
        const needle = String(color).trim().toLowerCase()
        const key = LOBE_PRIMARY_COLOR_KEYS.find(
            (k) => String(primaryColors[k]).trim().toLowerCase() === needle,
        )
        if (key) {
            setSetting('primaryColor', key)
        } else if (LOBE_PRIMARY_COLOR_KEYS.includes(needle)) {
            setSetting('primaryColor', needle)
        }
        void persistUserSettingsToDisk()
    }

    // 处理使用系统浏览器变更
    const handleUseSystemBrowserChange = async (checked) => {
        setSetting('useSystemBrowser', checked)
        await persistUserSettingsToDisk()
    }

    // 处理顶栏显示变更
    const handleTitleBarMetaChange = async (checked) => {
        setSetting('titleBarShowVersionAndTagline', checked)
        await persistUserSettingsToDisk()
    }

    // 处理开发者工具切换
    const handleDevToolsToggle = async (checked) => {
        if (!electron?.toggleDevTools || !electron?.isDevToolsOpened) return
        const cur = await electron.isDevToolsOpened()
        if (Boolean(checked) !== Boolean(cur)) {
            await electron.toggleDevTools()
        }
        setDevToolsEnabled(await electron.isDevToolsOpened())
    }

    // 处理数据路径变更后的刷新
    const handleDataPathChange = async () => {
        await useYgoDatabaseStore.getState().loadLocalDatabase()
        await useYgoDatabaseStore.getState().loadDecks()
    }

    // 处理每页条数变更
    const handleLibraryPageSizeChange = async (value) => {
        const normalized = normalizeLibraryPageSize(value ?? DEFAULT_LIBRARY_PAGE_SIZE)
        setSetting('libraryPageSize', normalized)
        await persistUserSettingsToDisk()
        useYgoDatabaseStore.getState().setFilters({ apiPageSize: normalized })
        await useYgoDatabaseStore.getState().fetchOnlinePage(1)
    }

    // 构建表单配置
    const items = [
        {
            key: 'appearance',
            icon: Palette,
            title: '外观',
            children: AppearanceSection({
                settings,
                localTheme,
                onThemeChange: handleThemeChange,
                onPrimaryColorChange: handlePrimaryColorChange,
            }),
        },
        {
            key: 'general',
            icon: SlidersHorizontal,
            title: '通用',
            children: GeneralSection({
                settings,
                devToolsEnabled,
                hasElectron: !!electron?.toggleDevTools,
                onUseSystemBrowserChange: handleUseSystemBrowserChange,
                onTitleBarMetaChange: handleTitleBarMetaChange,
                onDevToolsToggle: handleDevToolsToggle,
            }),
        },
        {
            key: 'storage',
            icon: HardDrive,
            title: '存储与数据',
            children: StorageSection({
                hasElectron: !!electron?.getDataRootInfo,
                onDataPathChange: handleDataPathChange,
            }),
        },
        {
            key: 'database',
            icon: Library,
            title: '卡牌数据库',
            children: DatabaseSection({
                settings,
                onLibraryPageSizeChange: handleLibraryPageSizeChange,
            }),
        },
        {
            key: 'about',
            icon: Info,
            title: '关于',
            children: AboutSection(),
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
