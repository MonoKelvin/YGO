import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { ScrollArea, Text, Button } from '@lobehub/ui'
import {
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  BookOpen,
  BookMarked,
  ChevronUp,
  ChevronRight,
} from 'lucide-react'
import mdEncyclopedia from '../../assets/docs/rules/00-encyclopedia-intro.zh.md?raw'
import mdBeginner from '../../assets/docs/rules/01-beginner.zh.md?raw'
import mdCore from '../../assets/docs/rules/02-core.zh.md?raw'
import mdAdvanced from '../../assets/docs/rules/03-advanced.zh.md?raw'
import mdDetailed from '../../assets/docs/rules/04-detailed.zh.md?raw'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { RULE_REFERENCE_SOURCES } from '../../config/ruleSources'
import './RulesWiki.css'

const SCROLL_TOP_BTN_SHOW_PX = 200

const RULE_SECTIONS_RAW = [
  { id: 'part-encyclopedia', title: '百科引言', md: mdEncyclopedia },
  { id: 'part-beginner', title: '入门', md: mdBeginner },
  { id: 'part-core', title: '基础', md: mdCore },
  { id: 'part-advanced', title: '进阶', md: mdAdvanced },
  { id: 'part-detailed', title: '深入', md: mdDetailed },
]

function extractHeadings(sectionId, md) {
  try {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(md || '')
    const headings = []
    let h2Count = 0
    let h3Count = 0

    visit(tree, 'heading', (node) => {
      const title = toString(node).trim()
      if (node.depth === 1) {
        headings.push({ id: sectionId, title, depth: 1 })
      } else if (node.depth === 2) {
        headings.push({ id: `${sectionId}__h2-${h2Count++}`, title, depth: 2 })
      } else if (node.depth === 3) {
        headings.push({ id: `${sectionId}__h3-${h3Count++}`, title, depth: 3 })
      }
    })
    return headings
  } catch {
    return []
  }
}

function remarkHeadingIds(sectionId) {
  return (tree) => {
    try {
      let h2Count = 0
      let h3Count = 0
      visit(tree, 'heading', (node) => {
        if (node.depth === 1) {
          node.data = node.data || {}
          node.data.hProperties = node.data.hProperties || {}
          node.data.hProperties.id = sectionId
        } else if (node.depth === 2) {
          const id = `${sectionId}__h2-${h2Count++}`
          node.data = node.data || {}
          node.data.hProperties = node.data.hProperties || {}
          node.data.hProperties.id = id
        } else if (node.depth === 3) {
          const id = `${sectionId}__h3-${h3Count++}`
          node.data = node.data || {}
          node.data.hProperties = node.data.hProperties || {}
          node.data.hProperties.id = id
        }
      })
    } catch { /* ignore */ }
  }
}

function joinResourcePath(base, ...segments) {
  const sep = base.includes('\\') ? '\\' : '/'
  let s = base.replace(/[/\\]+$/, '')
  for (const seg of segments) {
    s += sep + seg.replace(/^[/\\]+/, '')
  }
  return s
}

function createSharedMdComponents() {
  return {
    p: ({ children }) => <p className="wiki-p">{children}</p>,
    ul: ({ children }) => <ul className="wiki-ul">{children}</ul>,
    ol: ({ children }) => <ol className="wiki-ol">{children}</ol>,
    li: ({ children }) => <li className="wiki-li">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="wiki-blockquote">{children}</blockquote>
    ),
    code: ({ className, children }) => {
      const isBlock = className?.includes('language-')
      if (isBlock) {
        return <pre className="wiki-pre"><code>{children}</code></pre>
      }
      return <code className="wiki-code">{children}</code>
    },
    table: ({ children }) => (
      <div className="wiki-table-wrap">
        <table className="wiki-table">{children}</table>
      </div>
    ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="wiki-link">
        {children}
      </a>
    ),
    hr: () => <hr className="wiki-hr" />,
  }
}

function MarkdownSection({ section, sharedMd }) {
  const remarkPlugins = useMemo(
    () => [remarkGfm, remarkHeadingIds(section.id)],
    [section.id],
  )

  const components = useMemo(
    () => ({
      ...sharedMd,
      h1: ({ children, id }) => <h1 id={id} className="wiki-h1">{children}</h1>,
      h2: ({ children, id }) => <h2 id={id} className="wiki-h2">{children}</h2>,
      h3: ({ children, id }) => <h3 id={id} className="wiki-h3">{children}</h3>,
    }),
    [sharedMd],
  )

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {section.md}
    </ReactMarkdown>
  )
}

function TocItem({ item, activeId, onActivate }) {
  const isActive = activeId === item.id

  return (
    <div className="wiki-toc-group">
      <button
        type="button"
        className={`wiki-toc-item depth-${item.depth}${isActive ? ' active' : ''}`}
        onClick={() => onActivate(item.id)}
      >
        {item.depth === 1 && <span className="wiki-toc-dot" />}
        {item.depth === 2 && <ChevronRight size={12} className="wiki-toc-icon" />}
        {item.depth === 3 && <span className="wiki-toc-line" />}
        <span className="wiki-toc-text">{item.title}</span>
      </button>
      {item.children?.length > 0 && (
        <div className="wiki-toc-children">
          {item.children.map((child) => (
            <TocItem key={child.id} item={child} activeId={activeId} onActivate={onActivate} />
          ))}
        </div>
      )}
    </div>
  )
}

function getScrollViewport(ref) {
  if (!ref.current) return null
  return (
    ref.current.querySelector('[data-radix-scroll-area-viewport]') ||
    ref.current.querySelector('[class*="viewport"]') ||
    ref.current
  )
}

export default function RulesWiki() {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  const contentScrollRef = useRef(null)
  const sidebarScrollRef = useRef(null)
  const observerRef = useRef(null)
  const isScrollingRef = useRef(false)

  const sections = useMemo(
    () => RULE_SECTIONS_RAW.map((s) => ({ ...s, headings: extractHeadings(s.id, s.md) })),
    [],
  )

  const sharedMd = useMemo(() => createSharedMdComponents(), [])

  const tocTree = useMemo(() => {
    const tree = []
    for (const s of sections) {
      const sectionNode = { id: s.id, title: s.title, depth: 1, children: [] }
      let currentH2 = null

      for (const h of s.headings) {
        if (h.depth === 1) {
          sectionNode.title = h.title
        } else if (h.depth === 2) {
          currentH2 = { ...h, children: [] }
          sectionNode.children.push(currentH2)
        } else if (h.depth === 3 && currentH2) {
          currentH2.children.push(h)
        }
      }
      tree.push(sectionNode)
    }
    return tree
  }, [sections])

  const allHeadingIds = useMemo(() => {
    const ids = []
    for (const section of sections) {
      for (const h of section.headings) {
        ids.push(h.id)
      }
    }
    return ids
  }, [sections])

  const [activeId, setActiveId] = useState(() => allHeadingIds[0] ?? null)
  const [showScrollTopBtn, setShowScrollTopBtn] = useState(false)

  const scrollToHeading = useCallback((id) => {
    const viewport = getScrollViewport(contentScrollRef)
    if (!viewport) return

    const el = document.getElementById(id)
    if (!el) return

    isScrollingRef.current = true
    const viewportRect = viewport.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const targetScrollTop = viewport.scrollTop + (elRect.top - viewportRect.top) - 24

    viewport.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
    setTimeout(() => { isScrollingRef.current = false }, 600)
  }, [])

  const scrollToTop = useCallback(() => {
    const viewport = getScrollViewport(contentScrollRef)
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const viewport = getScrollViewport(contentScrollRef)
    if (!viewport) return

    const handleScroll = () => {
      setShowScrollTopBtn(viewport.scrollTop >= SCROLL_TOP_BTN_SHOW_PX)
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const viewport = getScrollViewport(contentScrollRef)
    if (!viewport) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const visibleMap = new Map()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return

        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleMap.set(entry.target.id, entry.boundingClientRect.top)
          } else {
            visibleMap.delete(entry.target.id)
          }
        }

        if (visibleMap.size > 0) {
          let bestId = null
          let bestTop = Infinity

          for (const [id, top] of visibleMap) {
            if (top < bestTop && top > -100) {
              bestTop = top
              bestId = id
            }
          }

          if (bestId && bestId !== activeId) {
            setActiveId(bestId)
          }
        }
      },
      { root: viewport, rootMargin: '-24px 0px -70% 0px', threshold: 0 }
    )

    for (const id of allHeadingIds) {
      const el = document.getElementById(id)
      if (el) observerRef.current.observe(el)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [allHeadingIds, activeId])

  useEffect(() => {
    if (!activeId) return
    const sidebarViewport = getScrollViewport(sidebarScrollRef)
    const activeBtn = sidebarScrollRef.current?.querySelector('.wiki-toc-item.active')
    
    if (activeBtn && sidebarViewport) {
      const btnRect = activeBtn.getBoundingClientRect()
      const viewportRect = sidebarViewport.getBoundingClientRect()
      
      if (btnRect.top < viewportRect.top + 40 || btnRect.bottom > viewportRect.bottom - 40) {
        activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeId])

  const handleOpenPdf = async () => {
    if (!electron?.getResourcePath || !electron?.openPathInExplorer) return
    try {
      const base = await electron.getResourcePath()
      const pdfPath = joinResourcePath(base, 'docs', 'Rulebook_v9_official_en.pdf')
      const res = await electron.openPathInExplorer(pdfPath)
      if (!res.success) window.alert(res.error || '无法打开 PDF')
    } catch (e) {
      window.alert(e.message || String(e))
    }
  }

  const handleOpenDocsFolder = async () => {
    if (!electron?.getResourcePath || !electron?.openPathInExplorer) return
    try {
      const base = await electron.getResourcePath()
      await electron.openPathInExplorer(joinResourcePath(base, 'docs'))
    } catch (e) {
      window.alert(e.message || String(e))
    }
  }

  const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer')

  return (
    <div className="wiki-container">
      <div className="wiki-header">
        <div className="wiki-header-content">
          <div className="wiki-header-title">
            <BookOpen size={22} />
            <h1>规则百科</h1>
          </div>
          <Text className="wiki-header-desc">
            游戏王规则由浅入深：入门 → 基础 → 进阶 → 深入。竞技裁定以 Konami 官方数据库为准。
          </Text>
        </div>
      </div>

      <div className="wiki-body">
        <div className="wiki-content">
          <ScrollArea ref={contentScrollRef} className="wiki-content-scroll">
            <article className="wiki-article">
              {sections.map((s) => (
                <section key={s.id} className="wiki-section">
                  <MarkdownSection section={s} sharedMd={sharedMd} />
                </section>
              ))}
            </article>
          </ScrollArea>
          {showScrollTopBtn && (
            <Button className="wiki-scroll-top" onClick={scrollToTop} icon={<ChevronUp />} size="small" variant="filled" />
          )}
        </div>

        <div className="wiki-sidebar">
          <ScrollArea ref={sidebarScrollRef} className="wiki-sidebar-scroll">
            <div className="wiki-sidebar-content">
              <div className="wiki-card">
                <div className="wiki-card-header">
                  <BookMarked size={16} />
                  <span>目录导航</span>
                </div>
                <nav className="wiki-toc-nav">
                  {tocTree.map((section) => (
                    <TocItem key={section.id} item={section} activeId={activeId} onActivate={scrollToHeading} />
                  ))}
                </nav>
              </div>

              <div className="wiki-card">
                <div className="wiki-card-header">
                  <Link2 size={16} />
                  <span>参考资料</span>
                </div>
                <Text className="wiki-card-desc">竞技裁定以 Konami 官方数据库为准。</Text>
                <div className="wiki-links">
                  {RULE_REFERENCE_SOURCES.slice(0, 3).map((src) => (
                    <Button
                      key={src.id}
                      variant="text"
                      size="small"
                      block
                      className="wiki-link-btn"
                      icon={<ExternalLink size={12} />}
                      onClick={() => openExternal(src.url)}
                    >
                      {src.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="wiki-card">
                <div className="wiki-card-header">
                  <FileText size={16} />
                  <span>官方规则书</span>
                </div>
                <div className="wiki-links">
                  <Button variant="text" size="small" block icon={<FileText size={12} />} onClick={handleOpenPdf} disabled={!electron?.getResourcePath}>
                    打开本地 PDF
                  </Button>
                  <Button variant="text" size="small" block icon={<ExternalLink size={12} />} onClick={() => openExternal('https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_en.pdf')}>
                    浏览器下载
                  </Button>
                  {electron?.getResourcePath && (
                    <Button variant="text" size="small" block icon={<FolderOpen size={12} />} onClick={handleOpenDocsFolder}>
                      文档文件夹
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
