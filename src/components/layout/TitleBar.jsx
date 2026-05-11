import { useState, useEffect } from 'react'
import { Minus, X, Square, SquareMinus } from 'lucide-react'
import { APP_TAGLINE, APP_VERSION, IS_DEV_BUILD } from '../../config/appMeta'
import './TitleBar.css'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const electron = typeof window !== 'undefined' ? window.electronAPI : null
    const sync = async () => {
      if (!electron?.windowIsMaximized) return
      const maximized = await electron.windowIsMaximized()
      setIsMaximized(maximized)
    }
    void sync()
    if (electron?.onWindowMaximizedState) {
      return electron.onWindowMaximizedState((v) => setIsMaximized(v))
    }
    return undefined
  }, [])

  const api = typeof window !== 'undefined' ? window.electronAPI : null

  const handleMinimize = async () => {
    await api?.windowMinimize?.()
  }

  const handleMaximize = async () => {
    await api?.windowMaximize?.()
    const maximized = await api?.windowIsMaximized?.()
    if (typeof maximized === 'boolean') setIsMaximized(maximized)
  }

  const handleClose = async () => {
    await api?.windowClose?.()
  }

  const titleFull = `YGO v${APP_VERSION} — ${APP_TAGLINE}${IS_DEV_BUILD ? ' dev' : ''}`

  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <div className="title-bar-side title-bar-side-left" aria-hidden="true" />
        <div className="title-bar-center">
          <span className="title-bar-brand" aria-hidden="true">
            YGO
          </span>
          <span className="title-bar-meta" title={titleFull}>
            <span className="title-bar-ver">v{APP_VERSION}</span>
            <span className="title-bar-dash">—</span>
            <span className="title-bar-tagline">{APP_TAGLINE}</span>
            {IS_DEV_BUILD && (
              <span className="title-bar-dev-badge" title="开发构建">
                dev
              </span>
            )}
          </span>
        </div>
        <div className="title-bar-side title-bar-side-right">
          <button
            onClick={handleMinimize}
            title="最小化"
            aria-label="最小化"
            className="titlebar-btn"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleMaximize}
            title={isMaximized ? '还原' : '最大化'}
            aria-label={isMaximized ? '还原' : '最大化'}
            className="titlebar-btn"
          >
            {isMaximized ? <SquareMinus size={14} /> : <Square size={14} />}
          </button>
          <button
            onClick={handleClose}
            title="关闭"
            aria-label="关闭"
            className="titlebar-btn titlebar-btn-close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
