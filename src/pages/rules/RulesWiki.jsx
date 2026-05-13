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
  {
    id: 'part-encyclopedia',
    title: '百科引言',
    md: mdEncyclopedia,
  },
  {
    id: 'part-beginner',
    title: '入门',
    md: mdBeginner,
  },
  {
    id: 'part-core',
    title: '基础',
    md: mdCore,
  },
  {
    id: 'part-advanced',
    title: '进阶',
    md: mdAdvanced,
  },
  {
    id: 'part-detailed',
    title: '深入',
    md: mdDetailed,
  },
]

function extractHeadings(sectionId, md) {
  try {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(md || '')
    const headings = []
    let h1Counter = 0
    let h2Counter = 0
    let h3Counter = 0
    
    visit(tree, 'heading', (node) => {
      const title = toString(node).trim()
      if (node.depth === 1) {
        headings.push({
          id: sectionId,
          title,
          depth: 1,
        })
        h1Counter++
      } else if (node.depth === 2) {
        headings.push({
          id: `${sectionId}__h2-${h2Counter++}`,
          title,
          depth: 2,
        })
      } else if (node.depth === 3) {
        headings.push({
          id: `${sectionId}__h3-${h3Counter++}`,
          title,
          depth: 3,
        })
      }
    })
    return headings
  } catch (e) {
    console.error('[RulesWiki] 目录解析失败', sectionId, e)
    return []
  }
}

function remarkHeadingIds(sectionId) {
  return (tree) => {
    try {
      let h2Counter = 0
      let h3Counter = 0
      visit(tree, 'heading', (node) => {
        if (node.depth === 1) {
          node.data ??= {}
          node.data.hProperties ??= {}
          node.data.hProperties.id = sectionId
        } else if (node.depth === 2) {
          const id = `${sectionId}__h2-${h2Counter++}`
          node.data ??= {}
          node.data.hProperties ??= {}
          node.data.hProperties.id = id
        } else if (node.depth === 3) {
          const id = `${sectionId}__h3-${h3Counter++}`
          node.data ??= {}
          node.data.hProperties ??= {}
          node.data.hProperties.id = id
        }
      })
    } catch (e) {
      console.error('[RulesWiki] remarkHeadingIds', sectionId, e)
    }
  }
}

function joinResourcePath(base, ...segments) {
  const sep = base.includes('\\') ? '\\' : '/'
  let s = base.replace(/[/\\]+$/, '')
  for (const seg of segments) {
    s += sep + seg.replace(/^[/\\]+$/, '')
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
        return (
          <pre className="wiki-pre">
            <code>{children}</code>
          </pre>
        )
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
      h1: ({ children, id }) => (
        <h1 id={id} className="wiki-h1">
          {children}
        </h1>
      ),
      h2: ({ children, id }) => (
        <h2 id={id} className="wiki-h2">
          {children}
        </h2>
      ),
      h3: ({ children, id }) => (
        <h3 id={id} className="wiki-h3">
          {children}
        </h3>
      ),
    }),
    [sharedMd],
  )

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {section.md}
    </ReactMarkdown>
  )
}

function TocItem({ item, activeId, onActivate, level = 0 }) {
  const isActive = activeId === item.id
  const hasChildren = item.children && item.children.length > 0
  
  return (
    <div className="wiki-toc-group">
      <button
        type="button"
        className={`wiki-toc-item depth-${item.depth}${isActive ? ' active' : ''}`}
        onClick={() => onActivate(item.id)}
        style={{ paddingLeft: `${12 + level * 12}px` }}
      >
        {item.depth === 1 && <span className="wiki-toc-dot" />}
        {item.depth === 2 && <ChevronRight size={12} className="wiki-toc-chevron" />}
        {item.depth === 3 && <span className="wiki-toc-line" />}
        <span className="wiki-toc-text">{item.title}</span>
      </button>
      {hasChildren && (
        <div className="wiki-toc-children">
          {item.children.map((child) => (
            <TocItem
              key={child.id}
              item={child}
              activeId={activeId}
              onActivate={onActivate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function RulesWiki() {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  const contentViewportRef = useRef(null)
  const sidebarViewportRef = useRef(null)
  const observerRef = useRef(null)
  const isScrollingRef = useRef(false)

  const sections = useMemo(
    () =>
      RULE_SECTIONS_RAW.map((s) => ({
        ...s,
        headings: extractHeadings(s.id, s.md),
      })),
    [],
  )

  const sharedMd = useMemo(() => createSharedMdComponents(), [])

  const tocTree = useMemo(() => {
    const tree = []
    for (const s of sections) {
      const sectionNode = {
        id: s.id,
        title: s.title,
        depth: 1,
        children: [],
      }
      
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

  const findScrollableViewport = useCallback((scrollAreaRef) => {
    if (!scrollAreaRef.current) return null
    const el = scrollAreaRef.current
    return (
      el.querySelector('[data-radix-scroll-area-viewport]') ||
      el.querySelector('.ant-scroll-viewport') ||
      el
    )
  }, [])

  const scrollToHeading = useCallback((id) => {
    const viewport = findScrollableViewport(contentViewportRef)
    if (!viewport) return

    const el = document.getElementById(id)
    if (!el) return

    isScrollingRef.current = true
    
    const viewportRect = viewport.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const scrollTop = viewport.scrollTop + (elRect.top - viewportRect.top) - 24

    viewport.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    })

    setTimeout(() => {
      isScrollingRef.current = false
    }, 500)
  }, [findScrollableViewport])

  const scrollToTop = useCallback(() => {
    const viewport = findScrollableViewport(contentViewportRef)
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [findScrollableViewport])

  useEffect(() => {
    const viewport = findScrollableViewport(contentViewportRef)
    if (!viewport) return

    const handleScroll = () => {
      setShowScrollTopBtn(viewport.scrollTop >= SCROLL_TOP_BTN_SHOW_PX)
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [findScrollableViewport])

  useEffect(() => {
    const viewport = findScrollableViewport(contentViewportRef)
    if (!viewport) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const visibleHeadings = new Map()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return

        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleHeadings.set(entry.target.id, entry.boundingClientRect.top)
          } else {
            visibleHeadings.delete(entry.target.id)
          }
        }

        if (visibleHeadings.size > 0) {
          let topmostId = null
          let topmostTop = Infinity

          for (const [id, top] of visibleHeadings) {
            if (top < topmostTop && top > -100) {
              topmostTop = top
              topmostId = id
            }
          }

          if (topmostId && topmostId !== activeId) {
            setActiveId(topmostId)
          }
        }
      },
      {
        root: viewport,
        rootMargin: '-24px 0px -80% 0px',
        threshold: 0,
      }
    )

    for (const id of allHeadingIds) {
      const el = document.getElementById(id)
      if (el) {
        observerRef.current.observe(el)
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [allHeadingIds, activeId, findScrollableViewport])

  useEffect(() => {
    const sidebarViewport = findScrollableViewport(sidebarViewportRef)
    if (!sidebarViewport || !activeId) return

    const activeBtn = sidebarViewportRef.current?.querySelector('.wiki-toc-item.active')
    if (activeBtn) {
      const btnRect = activeBtn.getBoundingClientRect()
      const viewportRect = sidebarViewport.getBoundingClientRect()
      
      if (btnRect.top < viewportRect.top + 50 || btnRect.bottom > viewportRect.bottom - 50) {
        activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeId, findScrollableViewport])

  const handleOpenPdf = async () => {
    if (!electron?.getResourcePath || !electron?.openPathInExplorer) return
    try {
      const base = await electron.getResourcePath()
      const pdfPath = joinResourcePath(base, 'docs', 'Rulebook_v9_official_en.pdf')
      const res = await electron.openPathInExplorer(pdfPath)
      if (!res.success) {
        window.alert(res.error || '无法打开 PDF')
      }
    } catch (e) {
      window.alert(e.message || String(e))
    }
  }

  const handleOpenDocsFolder = async () => {
    if (!electron?.getResourcePath || !electron?.openPathInExplorer) return
    try {
      const base = await electron.getResourcePath()
      const folder = joinResourcePath(base, 'docs')
      await electron.openPathInExplorer(folder)
    } catch (e) {
      window.alert(e.message || String(e))
    }
  }

  const openExternal = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="wiki-container">
      <div className="wiki-header">
        <div className="wiki-header-inner">
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
          <ScrollArea
            ref={contentViewportRef}
            className="wiki-content-scroll"
            scrollbarProps={{ autoHide: true }}
          >
            <article className="wiki-article">
              {sections.map((s) => (
                <section key={s.id} className="wiki-section">
                  <MarkdownSection section={s} sharedMd={sharedMd} />
                </section>
              ))}
            </article>
          </ScrollArea>
          
          {showScrollTopBtn && (
            <Button
              className="wiki-scroll-top-btn"
              onClick={scrollToTop}
              icon={<ChevronUp />}
              size="small"
              variant="filled"
            />
          )}
        </div>

        <div className="wiki-sidebar">
          <ScrollArea
            ref={sidebarViewportRef}
            className="wiki-sidebar-scroll"
            scrollbarProps={{ autoHide: true }}
          >
            <div className="wiki-sidebar-inner">
              <div className="wiki-toc-card">
                <div className="wiki-toc-header">
                  <BookMarked size={14} />
                  <span>目录</span>
                </div>
                <nav className="wiki-toc-nav">
                  {tocTree.map((section) => (
                    <TocItem
                      key={section.id}
                      item={section}
                      activeId={activeId}
                      onActivate={scrollToHeading}
                    />
                  ))}
                </nav>
              </div>

              <div className="wiki-ref-card">
                <div className="wiki-ref-header">
                  <Link2 size={14} />
                  <span>资料来源</span>
                </div>
                <Text className="wiki-ref-desc">
                  竞技裁定以 Konami 官方数据库为准。
                </Text>
                <div className="wiki-ref-links">
                  {RULE_REFERENCE_SOURCES.slice(0, 3).map((src) => (
                    <Button
                      key={src.id}
                      variant="text"
                      size="small"
                      block
                      className="wiki-ref-btn"
                      icon={<ExternalLink size={12} />}
                      onClick={() => openExternal(src.url)}
                    >
                      {src.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="wiki-ref-card">
                <div className="wiki-ref-header">
                  <FileText size={14} />
                  <span>官方规则书</span>
                </div>
                <div className="wiki-ref-links">
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
                    onClick={() =>
                      openExternal(
                        'https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_en.pdf'
                      )
                    }
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
        </div>
      </div>
    </div>
  )
}
