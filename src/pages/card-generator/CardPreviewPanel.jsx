import { Flexbox, Tooltip, Button } from '@lobehub/ui'
import { Eye, EyeOff, RefreshCw, Pause } from 'lucide-react'
import CardPreview from '../../components/card-preview'

/**
 * 卡牌预览面板组件
 * @param {Object} props
 * @param {Object} props.formData - 卡牌表单数据
 * @param {boolean} props.previewVisible - 预览是否可见
 * @param {boolean} props.autoRefresh - 是否自动刷新
 * @param {Function} props.setPreviewVisible - 设置预览可见性
 * @param {Function} props.setAutoRefresh - 设置自动刷新
 * @param {Function} props.refreshCard - 刷新卡牌
 */
function CardPreviewPanel({
    formData,
    previewVisible,
    autoRefresh,
    setPreviewVisible,
    setAutoRefresh,
    refreshCard
}) {
    const handleRefreshToggle = () => {
        if (autoRefresh) {
            setAutoRefresh(false)
        } else {
            setAutoRefresh(true)
            refreshCard()
        }
    }

    return (
        <Flexbox
            flex={0}
            vertical
            align="center"
            gap={8}
            style={{ width: '100%', minHeight: 0 }}
        >
            <Flexbox horizontal gap={0} className="card-generator-preview-controls">
                <Tooltip title={autoRefresh ? '已开启自动刷新' : '已关闭自动刷新，点击刷新'}>
                    <Button
                        size="default"
                        variant="outlined"
                        icon={autoRefresh ? <RefreshCw size={16} /> : <RefreshCw size={16} />}
                        onClick={handleRefreshToggle}
                        type={previewVisible ? (autoRefresh ? 'primary' : 'default') : 'default'}
                        disabled={!previewVisible}
                    />
                </Tooltip>
                <Tooltip title={previewVisible ? '隐藏预览' : '显示预览'}>
                    <Button
                        size="default"
                        variant="outlined"
                        icon={previewVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        onClick={() => setPreviewVisible(!previewVisible)}
                        type={previewVisible ? 'primary' : 'default'}
                    />
                </Tooltip>
            </Flexbox>
            {!previewVisible ? (
                <div className="card-generator-preview-placeholder">
                    <div className="card-generator-preview-placeholder-inner">
                        <EyeOff size={48} />
                        <span>预览已隐藏</span>
                    </div>
                </div>
            ) : (
                <Flexbox
                    vertical
                    align="center"
                    style={{
                        position: 'relative',
                        alignSelf: 'stretch',
                        width: '100%',
                        minWidth: 0,
                        flexShrink: 0,
                    }}
                >
                    <CardPreview card={formData} className="card-generator-preview-canvas-wrap" />
                    {!autoRefresh && (
                        <>
                            <Flexbox className="card-generator-preview-paused-wrap">
                                <Flexbox className="card-generator-preview-paused-overlay" />
                            </Flexbox>
                            <Flexbox
                                className="card-generator-preview-paused-blur"
                                vertical
                                align="center"
                                justify="center"
                                gap={8}
                            >
                                <Pause size={48} />
                                <span>刷新已暂停</span>
                            </Flexbox>
                        </>
                    )}
                </Flexbox>
            )}
        </Flexbox>
    )
}

export default CardPreviewPanel
