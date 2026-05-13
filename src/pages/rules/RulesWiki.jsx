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

const RULE_SECTIONS = [
  { id: 'intro', title: '百科引言', md: mdEncyclopedia },
  { id: 'beginner', title: '入门', md: mdBeginner },
  { id: 'core', title: '基础', md: mdCore },
  { id: 'advanced', title: '进阶', md: mdAdvanced },
  { id: 'detailed', title: '深入', md: mdDetailed },
]

function extractHeadings(sectionId, md) {
  try {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(md || '')
    const headings = []
    let h2Index = 0
    let h3Index = 0
    
    visit(tree, 'heading', (node) => {
      const title = toString(node).trim()
      if (node.depth === 1) {
        headings.push({ id: sectionId, title, depth: 1 })
      } else if (node.depth === 2) {
        headings.push({ id: `${sectionId}-h2-${h2Index++}`, title, depth: 2 })
      } else if (node.depth === 3) {
        headings.push({ id: `${sectionId}-h3-${h3Index++}`, title, depth: 3 })
      }
    })
    return headings
  } catch {
    return []
  }
}

function remarkHeadingIds(sectionId) {
  return (tree) => {
    let h2Index = 0
    let h3Index = 0
    visit(tree, 'heading', (node) => {
      if (node.depth === 1) {
        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}
        node.data.hProperties.id = sectionId
      } else if (node.depth === 2) {
        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}
        node.data.hProperties.id = `${sectionId}-h2-${h2Index++}`
      } else if (node.depth === 3) {
        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}
        node.data.hProperties.id = `${sectionId}-h3-${h3Index++}`
      }
    })
  }
}

function MarkdownSection({ section }) {
  const remarkPlugins = useMemo(() => [remarkGfm, remarkHeadingIds(section.id)], [section.id])
  
  const components = useMemo(() => ({
    h1: ({ children, id }) => <h1 id={id} className="wiki-h1">{children}</h1>,
    h2: ({ children, id }) => <h2 id={id} className="wiki-h2">{children}</h2>,
    h3: ({ children, id }) => <h3 id={id} className="wiki-h3">{children}</h3>,
    p: ({ children }) => <p className="wiki-p">{children}</p>,
    ul: ({ children }) => <ul className="wiki-ul">{children}</ul>,
    ol: ({ children }) => <ol className="wiki-ol">{children}</ol>,
    li: ({ children }) => <li className="wiki-li">{children}</li>,
    blockquote: ({ children }) => <blockquote className="wiki-blockquote">{children}</blockquote>,
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
  }), [])

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {section.md}
    </ReactMarkdown>
  )
}

function TocButton({ item, isActive, onClick }) {
  const indentStyle = { paddingLeft: `${(item.depth - 1) * 16 + 8}px` }
  
  return (
    <button
      type="button"
      className={`wiki-toc-btn depth-${item.depth}${isActive ? ' active' : ''}`}
      onClick={() => onClick(item.id)}
      style={indentStyle}
    >
      <span className="wiki-toc-marker">
        {item.depth === 1 && <span className="marker-dot" />}
        {item.depth === 2 && <span className="marker-dash" />}
        {item.depth === 3 && <span className="marker-line" />}
      </span>
      <span className="wiki-toc-label">{item.title}</span>
    </button>
  )
}

export default function RulesWiki() {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  const contentRef = useRef(null)
  const sidebarRef = useRef(null)
  const observerRef = useRef(null)
  
  const sectionsWithHeadings = useMemo(
    () => RULE_SECTIONS.map((s) => ({ ...s, headings: extractHeadings(s.id, s.md) })),
    [],
  )

  const tocItems = useMemo(() => {
    const items = []
    for (const section of sectionsWithHeadings) {
      items.push({ id: section.id, title: section.title, depth: 1 })
      for (const h of section.headings) {
        if (h.depth >= 2) {
          items.push(h)
        }
      }
    }
    return items
  }, [sectionsWithHeadings])

  const allHeadingIds = useMemo(() => tocItems.map((item) => item.id), [tocItems])
  const [activeId, setActiveId] = useState(allHeadingIds[0] || null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const scrollToElement = useCallback((id) => {
    const contentScroll = contentRef.current?.querySelector('[data-radix-scroll-area-viewport]') || contentRef.current
    if (!contentScroll) return

    const el = document.getElementById(id)
    if (!el) return

    const contentRect = contentScroll.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const scrollTop = contentScroll.scrollTop + (elRect.top - contentRect.top) - 20

    contentScroll.scrollTo({ top: scrollTop, behavior: 'smooth' })
  }, [])

  const scrollToTop = useCallback(() => {
    const contentScroll = contentRef.current?.querySelector('[data-radix-scroll-area-viewport]') || contentRef.current
    if (contentScroll) {
      contentScroll.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const contentScroll = contentRef.current?.querySelector('[data-radix-scroll-area-viewport]') || contentRef.current
    if (!contentScroll) return

    const handleScroll = () => {
      setShowScrollTop(contentScroll.scrollTop >= 200)
    }

    contentScroll.addEventListener('scroll', handleScroll, { passive: true })
    return () => contentScroll.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const contentScroll = contentRef.current?.querySelector('[data-radix-scroll-area-viewport]') || contentRef.current
    if (!contentScroll) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let visibleHeading = null
        let minTop = Infinity

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const top = entry.boundingClientRect.top
            if (top < minTop && top > -50) {
              minTop = top
              visibleHeading = entry.target.id
            }
          }
        }

        if (visibleHeading && visibleHeading !== activeId) {
          setActiveId(visibleHeading)
        }
      },
      {
        root: contentScroll,
        rootMargin: '-20px 0px -70% 0px',
        threshold: 0.1,
      }
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
    const sidebarScroll = sidebarRef.current?.querySelector('[data-radix-scroll-area-viewport]') || sidebarRef.current
    const activeBtn = sidebarRef.current?.querySelector('.wiki-toc-btn.active')
    
    if (activeBtn && sidebarScroll) {
      const btnRect = activeBtn.getBoundingClientRect()
      const sidebarRect = sidebarScroll.getBoundingClientRect()
      
      if (btnRect.top < sidebarRect.top + 30 || btnRect.bottom > sidebarRect.bottom - 30) {
        activeBtn.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }, [activeId])

  const handleOpenPdf = async () => {
    if (!electron?.getResourcePath || !electron?.openPathInExplorer) return
    try {
      const base = await electron.getResourcePath()
      const pdfPath = `${base}/docs/Rulebook_v9_official_en.pdf`.replace(/\\/g, '/')
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
      await electron.openPathInExplorer(`${base}/docs`.replace(/\\/g, '/'))
    } catch (e) {
      window.alert(e.message || String(e))
    }
  }

  const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer')

  return (
    <div className="wiki-root">
      <header className="wiki-header">
        <div className="wiki-header-inner">
          <div className="wiki-title">
            <BookOpen size={22} />
            <h1>规则百科</h1>
          </div>
          <Text className="wiki-subtitle">
            游戏王规则由浅入深：入门 → 基础 → 进阶 → 深入。竞技裁定以 Konami 官方数据库为准。
          </Text>
        </div>
      </header>

      <div className="wiki-main">
        <main className="wiki-content">
          <ScrollArea ref={contentRef} className="wiki-scroll">
            <div className="wiki-body">
              {sectionsWithHeadings.map((section) => (
                <section key={section.id} className="wiki-section">
                  <MarkdownSection section={section} />
                </section>
              ))}
            </div>
          </ScrollArea>
          
          {showScrollTop && (
            <Button className="wiki-scroll-top" onClick={scrollToTop} icon={<ChevronUp />} size="small" variant="filled" />
          )}
        </main>

        <aside className="wiki-sidebar">
          <ScrollArea ref={sidebarRef} className="wiki-sidebar-scroll">
            <div className="wiki-sidebar-inner">
              <div className="wiki-card">
                <div className="wiki-card-header">
                  <BookMarked size={16} />
                  <span>目录导航</span>
                </div>
                <nav className="wiki-toc">
                  {tocItems.map((item) => (
                    <TocButton
                      key={item.id}
                      item={item}
                      isActive={activeId === item.id}
                      onClick={scrollToElement}
                    />
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
                  <Button
                    variant="text"
                    size="small"
                    block
                    icon={<FileText size={12} />}
                    onClick={handleOpenPdf}
                    disabled={!electron?.getResourcePath}
                  >
                    打开本地 PDF
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    block
                    icon={<ExternalLink size={12} />}
                    onClick={() => openExternal('https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_en.pdf')}
                  >
                    浏览器下载
                  </Button>
                  {electron?.getResourcePath && (
                    <Button
                      variant="text"
                      size="small"
                      block
                      icon={<FolderOpen size={12} />}
                      onClick={handleOpenDocsFolder}
                    >
                      文档文件夹
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}
