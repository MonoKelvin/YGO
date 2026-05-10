import { useState, useEffect } from 'react'
import { Minus, Square, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ActionIcon } from '@lobehub/ui'
import './TitleBar.css'

export default function TitleBar({ onToggleSidebar, collapsed }) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.windowIsMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()
  }, [])

  const handleMinimize = async () => {
    await window.electronAPI.windowMinimize()
  }

  const handleMaximize = async () => {
    await window.electronAPI.windowMaximize()
    const maximized = await window.electronAPI.windowIsMaximized()
    setIsMaximized(maximized)
  }

  const handleClose = async () => {
    await window.electronAPI.windowClose()
  }

  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <div className="title-bar-left">
          <ActionIcon
            size="small"
            variant="ghost"
            onClick={onToggleSidebar}
            className="sidebar-toggle"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </ActionIcon>
        </div>
        <div className="title-bar-center">
          <span className="app-title">YGO</span>
        </div>
        <div className="title-bar-right">
          <ActionIcon
            size="small"
            variant="ghost"
            onClick={handleMinimize}
            className="window-action-btn minimize-btn"
          >
            <Minus size={14} />
          </ActionIcon>
          <ActionIcon
            size="small"
            variant="ghost"
            onClick={handleMaximize}
            className="window-action-btn maximize-btn"
          >
            <Square size={14} />
          </ActionIcon>
          <ActionIcon
            size="small"
            variant="ghost"
            onClick={handleClose}
            className="window-action-btn close-btn"
          >
            <X size={14} />
          </ActionIcon>
        </div>
      </div>
    </div>
  )
}
