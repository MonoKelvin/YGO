import { Checkbox, Flexbox, Modal, Tooltip } from '@lobehub/ui'
import { CircleAlert } from 'lucide-react'

import { isDefaultDeckId } from '../../config/deckConstants'
import { canAddCardsToDeck } from '../../store/useYgoDatabaseStore'

import './CardLibraryAddToDeckModal.css'

/**
 * Modal 内 Tooltip：挂到 .ant-modal-wrap 保证可见；styles 用 html[data-theme] 的 CSS 变量补全浮层样式。
 */
function resolveTooltipPortalContainer(triggerNode) {
  if (!triggerNode) return document.body
  return (
    triggerNode.closest('.ant-modal-wrap') ||
    triggerNode.closest('.ant-drawer') ||
    document.body
  )
}

/** 浮层在 modal-wrap 内时 emotion 的 cssVar 无效，用全局 token 内联样式对齐 Lobe Tooltip */
const ADD_DECK_TOOLTIP_STYLES = {
  container: {
    borderRadius: 6,
    fontSize: 'var(--font-size-sm, 12px)',
    lineHeight: 1.2,
    color: 'var(--ygo-tooltip-text, inherit)',
    background: 'var(--lobe-color-bg-elevated, var(--color-bg-elevated, #fff))',
    border: '1px solid var(--ygo-tooltip-border, rgba(0, 0, 0, 0.06))',
    boxShadow: 'var(--shadow-md)',
    maxWidth: 'min(320px, calc(100vw - 2rem))',
  },
  content: {
    padding: '4px 8px',
    color: 'var(--ygo-tooltip-text, inherit)',
  },
}

/**
 * 卡牌数据库「加入卡组」弹窗：多选卡组、不可加入时展示原因 Tooltip。
 */
export default function CardLibraryAddToDeckModal({
  open,
  addModalCards,
  decksForPicker,
  cardSnapshots,
  pickDeckIds,
  onToggleDeckId,
  onOk,
  onCancel,
}) {
  return (
    <Modal
      className="card-library-add-deck-modal"
      width={350}
      title={
        addModalCards.length > 1
          ? `加入卡组（${addModalCards.length} 张）`
          : '加入卡组'
      }
      open={open}
      okText="加入"
      cancelText="取消"
      okButtonProps={{ disabled: pickDeckIds.length === 0 }}
      onOk={onOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      {!decksForPicker.length ? (
        <p>暂无卡组，请先到「我的卡组」新建。</p>
      ) : (
        <Flexbox vertical gap={6} className="card-library-add-deck-list">
          {decksForPicker.map((d) => {
            const { ok, reason } = canAddCardsToDeck(
              d,
              addModalCards,
              cardSnapshots,
            )
            const disabled = !ok
            const checked = !disabled && pickDeckIds.includes(d.id)

            const toggleChecked = () => {
              if (disabled) return
              onToggleDeckId(d.id, !checked)
            }

            return (
              <div
                key={d.id}
                className={`card-library-add-deck-row${disabled ? ' card-library-add-deck-row--disabled' : ''}`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onChange={(next) => onToggleDeckId(d.id, next)}
                />
                <div
                  className="card-library-add-deck-main"
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  onClick={toggleChecked}
                  onKeyDown={(e) => {
                    if (disabled) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleChecked()
                    }
                  }}
                >
                  <span className="card-library-add-deck-name">
                    {d.name}
                    {isDefaultDeckId(d.id) ? ' · 默认' : ''}
                    {d.pinned && !isDefaultDeckId(d.id) ? ' · 置顶' : ''}
                  </span>
                  {disabled && reason ? (
                    <Tooltip
                      title={reason}
                      placement="top"
                      openDelay={200}
                      getPopupContainer={resolveTooltipPortalContainer}
                      styles={ADD_DECK_TOOLTIP_STYLES}
                    >
                      <button
                        type="button"
                        className="card-library-add-deck-warn"
                        aria-label={reason}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <CircleAlert size={15} strokeWidth={2} aria-hidden />
                      </button>
                    </Tooltip>
                  ) : null}
                </div>
              </div>
            )
          })}
        </Flexbox>
      )}
    </Modal>
  )
}
