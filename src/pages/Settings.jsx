import { useState, useEffect } from 'react'
import { Select, Switch } from 'antd'
import useCardStore from '../store/useStore'
import './Settings.css'

const themeOptions = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色模式' },
  { value: 'dark', label: '深色模式' },
]

export default function Settings() {
  const { settings, setSetting } = useCardStore()
  const [localTheme, setLocalTheme] = useState(settings.theme || 'system')
  const [autoSave, setAutoSave] = useState(settings.autoSave !== undefined ? settings.autoSave : true)
  const [devToolsEnabled, setDevToolsEnabled] = useState(false)

  useEffect(() => {
    const checkDevTools = async () => {
      const isOpen = await window.electronAPI.isDevToolsOpened()
      setDevToolsEnabled(isOpen)
    }
    checkDevTools()
  }, [])

  useEffect(() => {
    setLocalTheme(settings.theme || 'system')
  }, [settings.theme])

  const handleThemeChange = async (value) => {
    setLocalTheme(value)
    setSetting('theme', value)
    await window.electronAPI.setTheme(value)
    
    if (value === 'system') {
      const systemTheme = await window.electronAPI.getSystemTheme()
      document.documentElement.setAttribute('data-theme', systemTheme)
    } else {
      document.documentElement.setAttribute('data-theme', value)
    }
  }

  const handleAutoSaveChange = (checked) => {
    setAutoSave(checked)
    setSetting('autoSave', checked)
  }

  const handleDevToolsToggle = async () => {
    await window.electronAPI.toggleDevTools()
    const isOpen = await window.electronAPI.isDevToolsOpened()
    setDevToolsEnabled(isOpen)
  }

  return (
    <div className="settings-page">
      <h1 className="page-title">设置</h1>
      
      <div className="settings-section">
        <h2 className="section-title">外观</h2>
        <div className="settings-item">
          <label className="settings-label">主题</label>
          <Select
            value={localTheme}
            onChange={handleThemeChange}
            options={themeOptions}
            className="settings-select"
          />
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">通用</h2>
        <div className="settings-item">
          <label className="settings-label">自动保存</label>
          <Switch
            checked={autoSave}
            onChange={handleAutoSaveChange}
          />
        </div>
        <div className="settings-item">
          <label className="settings-label">开发者工具</label>
          <Switch
            checked={devToolsEnabled}
            onChange={handleDevToolsToggle}
          />
        </div>
      </div>
    </div>
  )
}
