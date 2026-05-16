import { Flexbox, Tooltip, Button } from '@lobehub/ui'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import CardPreview from '../../components/card-preview'

/**
 * 卡牌预览面板组件
 * @param {Object} props
 * @param {Object} props.previewCard - 传入画布的数据（可与表单分离，例如暂停刷新时冻结快照）
 * @param {boolean} props.previewVisible - 预览是否可见
 * @param {boolean} props.autoRefresh - 是否自动刷新
 * @param {Function} props.setPreviewVisible - 设置预览可见性
 * @param {Function} props.onToggleAutoRefresh - 切换自动刷新（由上层写入冻结快照等）
 */
function CardPreviewPanel({
  previewCard,
  previewVisible,
  autoRefresh,
  setPreviewVisible,
  onToggleAutoRefresh,
}) {
  return (
    <Flexbox
      flex={0}
      vertical
      align="center"
      gap={8}
      style={{ width: '100%', minHeight: 0 }}
    >
      <Flexbox horizontal gap={0} className="card-generator-preview-controls">
        <Tooltip title={autoRefresh ? '已开启自动刷新（点击暂停）' : '已暂停自动刷新（点击恢复）'}>
          <Button
            size="default"
            variant="outlined"
            icon={<RefreshCw size={16} />}
            onClick={onToggleAutoRefresh}
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
      <Flexbox
        vertical
        align="center"
        className={
          previewVisible
            ? 'card-generator-preview-slot'
            : 'card-generator-preview-slot card-generator-preview-slot--hidden-ui'
        }
        style={{
          position: 'relative',
          alignSelf: 'stretch',
          width: '100%',
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        {/**
         * 隐藏预览 UI 时仍保留离屏画布，便于「保存」导出 PNG（toDataURL 需要真实 canvas 节点）。
         */}
        <div
          className={
            previewVisible
              ? 'card-generator-preview-live card-generator-preview-live--visible'
              : 'card-generator-preview-live card-generator-preview-live--offscreen'
          }
        >
          <CardPreview
            card={previewCard}
            className="card-generator-preview-canvas-wrap"
            canvasClassName="card-generator-export-canvas"
          />
        </div>
        {!previewVisible ? (
          <div className="card-generator-preview-placeholder">
            <div className="card-generator-preview-placeholder-inner">
              <EyeOff size={48} />
              <span>预览已隐藏</span>
            </div>
          </div>
        ) : null}
        {previewVisible && !autoRefresh ? (
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
              <RefreshCw size={44} style={{ opacity: 0.85 }} />
              <span>暂停刷新</span>
            </Flexbox>
          </>
        ) : null}
      </Flexbox>
    </Flexbox>
  )
}

export default CardPreviewPanel
