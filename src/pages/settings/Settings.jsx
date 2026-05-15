import { useState, useEffect } from 'react'
import { Form } from '@lobehub/ui'
import { Palette, SlidersHorizontal, HardDrive, Library, Info } from 'lucide-react'
import useCardStore from '../../store/useStore'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import { persistUserSettingsToDisk } from '../../utils/persistUserSettings'
import { resolveThemePrimaryColor } from '../../config/lobePrimaryColor'
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

    // 处理主题色变更
    const handlePrimaryColorChange = (color) => {
        // 处理空值、透明值或默认蓝色（表示使用默认主题色）
        // ColorSwatches 选择透明选项时会传入 undefined
        if (color == null || color === '' || color === 'rgba(0, 0, 0, 0)' || color === '#1677ff') {
            setSetting('primaryColor', null)
        } else {
            const needle = String(color).trim().toLowerCase()
            // 查找对应的颜色键
            const colorMap = {
                '#f5222d': 'red',
                '#fa8c16': 'orange',
                '#faad14': 'gold',
                '#fadb14': 'yellow',
                '#8bbb11': 'lime',
                '#52c41a': 'green',
                '#13c2c2': 'cyan',
                '#1677ff': 'blue',
                '#2f4554': 'geekblue',
                '#722ed1': 'purple',
                '#eb2f96': 'magenta',
                '#ff4d4f': 'volcano',
                // rgba 格式的颜色值（ColorSwatches 可能传入这种格式）
                'rgb(245, 34, 45)': 'red',
                'rgb(250, 140, 22)': 'orange',
                'rgb(250, 173, 20)': 'gold',
                'rgb(250, 219, 20)': 'yellow',
                'rgb(139, 187, 17)': 'lime',
                'rgb(82, 196, 26)': 'green',
                'rgb(19, 194, 194)': 'cyan',
                'rgb(22, 119, 255)': 'blue',
                'rgb(47, 69, 84)': 'geekblue',
                'rgb(114, 46, 209)': 'purple',
                'rgb(235, 47, 150)': 'magenta',
                'rgb(255, 77, 79)': 'volcano',
            }
            const key = colorMap[needle]
            if (key) {
                setSetting('primaryColor', key)
            } else {
                // 如果没有找到匹配的颜色，直接使用传入的值作为颜色键
                // 这可能是一个有效的预设颜色名
                if (['red', 'orange', 'gold', 'yellow', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple', 'magenta', 'volcano'].includes(needle)) {
                    setSetting('primaryColor', needle)
                }
            }
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
