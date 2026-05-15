import { useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

/**
 * 目录导航组件
 * @param {Object} props
 * @param {Array} props.sections - 章节列表
 * @param {string} props.activeId - 当前激活的ID
 * @param {Object} props.expandedSections - 展开的章节状态
 * @param {Function} props.onToggleSection - 切换章节展开/折叠
 * @param {Function} props.onScrollToId - 滚动到指定ID
 * @param {Object} props.tocNavRef - 目录导航引用
 */
export default function TableOfContents({
  sections,
  activeId,
  expandedSections,
  onToggleSection,
  onScrollToId,
  tocNavRef,
}) {
  const handleSectionClick = useCallback((sectionId) => {
    onToggleSection(sectionId)
    onScrollToId(sectionId)
  }, [onToggleSection, onScrollToId])

  const handleH2Click = useCallback((h2Id) => {
    onScrollToId(h2Id)
  }, [onScrollToId])

  return (
    <nav ref={tocNavRef} className="rules-wiki-toc-nav" aria-label="章节列表">
      {sections.map((section) => {
        const isExpanded = expandedSections[section.id]
        const isSectionActive = activeId === section.id ||
          section.h2s.some((h) => activeId === h.id)

        return (
          <div key={section.id} className="rules-wiki-toc-section">
            {/* 章节标题（可点击展开/折叠并跳转） */}
            <button
              type="button"
              className={`rules-wiki-toc-part ${isSectionActive ? 'is-active' : ''}`}
              onClick={() => handleSectionClick(section.id)}
              title={section.subtitle}
              aria-expanded={isExpanded}
            >
              <span className="rules-wiki-toc-part-icon">
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </span>
              <span className="rules-wiki-toc-part-label">{section.title}</span>
              <span className="rules-wiki-toc-part-hint">{section.subtitle}</span>
            </button>

            {/* 子目录项 */}
            {isExpanded && section.h2s.length > 0 && (
              <div className="rules-wiki-toc-subitems">
                {section.h2s.map((h2) => (
                  <button
                    key={h2.id}
                    type="button"
                    className={`rules-wiki-toc-item ${activeId === h2.id ? 'is-active' : ''}`}
                    onClick={() => handleH2Click(h2.id)}
                  >
                    <ChevronRight className="rules-wiki-toc-item-indicator" size={12} />
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
