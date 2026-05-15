import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'

/**
 * 目录导航组件
 * @param {Object} props
 * @param {Array} props.sections - 章节列表
 * @param {string} props.activeId - 当前激活的ID
 * @param {Object} props.expandedSections - 展开的章节状态
 * @param {Function} props.onToggleSection - 仅切换章节展开/折叠（由左侧图标触发）
 * @param {Function} props.onExpandSection - 展开某章节（点击子标题跳转前保证可见）
 * @param {Function} props.onScrollToId - 滚动到指定ID
 * @param {Object} props.tocNavRef - 目录导航引用
 */
export default function TableOfContents({
  sections,
  activeId,
  expandedSections,
  onToggleSection,
  onExpandSection,
  onScrollToId,
  tocNavRef,
}) {
  const handleTitleClick = useCallback(
    (sectionId) => {
      onScrollToId(sectionId)
    },
    [onScrollToId],
  )

  const handleH2Click = useCallback(
    (sectionId, h2Id) => {
      flushSync(() => {
        onExpandSection(sectionId)
      })
      onScrollToId(h2Id)
    },
    [onExpandSection, onScrollToId],
  )

  return (
    <nav ref={tocNavRef} className="rules-wiki-toc-nav" aria-label="章节列表">
      {sections.map((section) => {
        const isExpanded = expandedSections[section.id]
        const isHeadActive = activeId === section.id
        const hasH2Active = section.h2s.some((h) => activeId === h.id)
        const isSectionActive = isHeadActive || hasH2Active
        const subListId =
          section.h2s.length > 0 ? `rules-wiki-toc-sub-${section.id}` : undefined

        return (
          <div key={section.id} className="rules-wiki-toc-section">
            <div
              className={[
                'rules-wiki-toc-part-row',
                isSectionActive ? 'is-active' : '',
                isHeadActive ? 'is-head-active' : '',
                hasH2Active && !isHeadActive ? 'is-active-via-h2' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="rules-wiki-toc-chevron-btn"
                aria-label={isExpanded ? '折叠子目录' : '展开子目录'}
                aria-expanded={isExpanded}
                {...(subListId ? { 'aria-controls': subListId } : {})}
                title={isExpanded ? '折叠子目录' : '展开子目录'}
                onClick={() => onToggleSection(section.id)}
              >
                <span className="rules-wiki-toc-chevron-icon" aria-hidden>
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
              </button>
              <button
                type="button"
                className="rules-wiki-toc-title-btn"
                onClick={() => handleTitleClick(section.id)}
                title={
                  section.subtitle
                    ? `${section.title}（${section.subtitle}）`
                    : section.title
                }
              >
                <span className="rules-wiki-toc-part-text">
                  <span className="rules-wiki-toc-part-title">{section.title}</span>
                  {section.subtitle ? (
                    <span className="rules-wiki-toc-part-bracket">
                      （{section.subtitle}）
                    </span>
                  ) : null}
                </span>
              </button>
            </div>

            {isExpanded && section.h2s.length > 0 && (
              <div
                className="rules-wiki-toc-subitems"
                id={subListId}
                role="group"
                aria-label={`${section.title} 子章节`}
              >
                {section.h2s.map((h2) => (
                  <button
                    key={h2.id}
                    type="button"
                    className={`rules-wiki-toc-item ${activeId === h2.id ? 'is-active' : ''}`}
                    onClick={() => handleH2Click(section.id, h2.id)}
                  >
                    <ChevronRight
                      className="rules-wiki-toc-item-indicator"
                      size={12}
                      aria-hidden
                    />
                    <span className="rules-wiki-toc-label">{h2.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
