import { useState, useEffect } from 'react'
import { Minus, X, Square, SquareMinus } from 'lucide-react'
import { Button, Header, Tag, Text } from '@lobehub/ui'
import { APP_TAGLINE, APP_VERSION, IS_DEV_BUILD } from '../../config/appMeta'
import useCardStore from '../../store/useStore'
import './TitleBar.css'

/** Lucide 笔画；实际像素由 CSS 固定 svg 盒子统一 */
const WIN_ICON_STROKE = 2

function WinIcon({ children }) {
    return <span className="ygo-titlebar-win-icon">{children}</span>
}

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false)
    const showVersionAndTagline = useCardStore(
        (s) => s.settings.titleBarShowVersionAndTagline !== false,
    )

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

    const iconProps = { strokeWidth: WIN_ICON_STROKE, absoluteStrokeWidth: false }

    return (
        <Header
            className="ygo-titlebar-header"
            logoStyle={{ flex: 1, minWidth: 0 }}
            navStyle={{ marginLeft: 0, flex: 1, minWidth: 0 }}
            logo={
                <div className="ygo-titlebar-drag ygo-titlebar-side-spacer" aria-hidden="true" />
            }
            nav={
                <div className="ygo-titlebar-drag ygo-titlebar-title-center" title={titleFull}>
                    <Text as="span" strong className="ygo-titlebar-brand ygo-titlebar-title-seg">
                        YGO
                    </Text>
                    {showVersionAndTagline ? (
                        <>
                            <Text as="span" type="secondary" className="ygo-titlebar-ver ygo-titlebar-title-seg">
                                v{APP_VERSION}
                            </Text>
                            <Text as="span" type="secondary" className="ygo-titlebar-sep ygo-titlebar-title-seg">
                                —
                            </Text>
                            <Text as="span" className="ygo-titlebar-tagline ygo-titlebar-title-seg">
                                {APP_TAGLINE}
                            </Text>
                        </>
                    ) : null}
                    {IS_DEV_BUILD ? (
                        <Tag color="orange" size="small" className="ygo-titlebar-dev-tag">
                            dev
                        </Tag>
                    ) : null}
                </div>
            }
            actions={
                <div className="ygo-titlebar-actions">
                    <Button
                        type="text"
                        className="ygo-titlebar-win-btn"
                        icon={
                            <WinIcon>
                                <Minus className="minus-icon" {...iconProps} />
                            </WinIcon>
                        }
                        onClick={() => void handleMinimize()}
                        title="最小化"
                        aria-label="最小化"
                    />
                    <Button
                        type="text"
                        className="ygo-titlebar-win-btn"
                        icon={
                            <WinIcon>
                                {isMaximized ? (
                                    <SquareMinus className="maximize-icon" {...iconProps} />
                                ) : (
                                    <Square className="maximize-icon" {...iconProps} />
                                )}
                            </WinIcon>
                        }
                        onClick={() => void handleMaximize()}
                        title={isMaximized ? '还原' : '最大化'}
                        aria-label={isMaximized ? '还原' : '最大化'}
                    />
                    <Button
                        type="text"
                        className="ygo-titlebar-win-btn ygo-titlebar-win-btn-close"
                        icon={
                            <WinIcon>
                                <X className="x-icon" {...iconProps} />
                            </WinIcon>
                        }
                        onClick={() => void handleClose()}
                        title="关闭"
                        aria-label="关闭"
                    />
                </div>
            }
        />
    )
}
