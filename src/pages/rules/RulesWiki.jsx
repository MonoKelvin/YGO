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

const SCROLL_TOP_BTN_SHOW_PX = 200

const RULE_SECTIONS_RAW = [
  {
    id: 'part-encyclopedia',
    title: '百科引言',
    subtitle: 'IP、资料站与外链索引',
    md: mdEncyclopedia,
  },
  {
    id: 'part-beginner',
    title: '入门',
    subtitle: '先读这段就能开局',
    md: mdBeginner,
  },
  {
    id: 'part-core',
    title: '基础',
    subtitle: '卡组、区域与胜负',
    md: mdCore,
  },
  {
    id: 'part-advanced',
    title: '进阶',
    subtitle: '回合、召唤、战斗与连锁入门',
    md: mdAdvanced,
  },
  {
    id: 'part-detailed',
    title: '深入',
    subtitle: '大师规则与竞技提示',
    md: mdDetailed,
  },
]

function extractSectionH2Nav(sectionId, md) {
  try {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(md || '')
    const h2s = []
    let i = 0
    visit(tree, 'heading', (node) => {
      if (node.depth !== 2) return
      h2s.push({
        id: `${sectionId}__h${i++}`,
        title: toString(node).trim(),
      })
    })
    return h2s
  } catch (e) {
    console.error('[RulesWiki] 目录解析失败', sectionId, e)
    return []
  }
}

function remarkHeadingIds(sectionId) {
  return (tree) => {
    try {
      let i = 0
      visit(tree, 'heading', (node) => {
        if (node.depth !== 2) return
        const id = `${sectionId}__h${i++}`
        node.data ??= {}
        node.data.hProperties ??= {}
        node.data.hProperties.id = id
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
    s += sep + seg.replace(/^[/\\]+/, '')
  }
  return s
}

function createSharedMdComponents() {
  return {
    p: ({ children }) => <p className="rules-wiki-p">{children}</p>,
    ul: ({ children }) => <ul className="rules-wiki-ul">{children}</ul>,
    ol: ({ children }) => <ol className="rules-wiki-ol">{children}</ol>,
    li: ({ children }) => <li className="rules-wiki-li">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="rules-wiki-quote">{children}</blockquote>
    ),
    code: ({ className, children }) => {
      const isBlock = className?.includes('language-')
      if (isBlock) {
        return (
          <pre className="rules-wiki-pre">
            <code>{children}</code>
          </pre>
        )
      }
      return <code className="rules-wiki-code">{children}</code>
    },
    table: ({ children }) => (
      <div className="rules-wiki-table-wrap">
        <table className="rules-wiki-table">{children}</table>
      </div>
    ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="rules-wiki-a">
        {children}
      </a>
    ),
    hr: () => <hr className="rules-wiki-hr" />,
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
      h1: ({ children }) => <h1 className="rules-wiki-h1">{children}</h1>,
      h2: ({ children, id, className }) => (
        <h2 id={id} className={['rules-wiki-h2', className].filter(Boolean).join(' ')}>
          {children}
        </h2>
      ),
      h3: ({ children }) => <h3 className="rules-wiki-h3">{children}</h3>,
    }),
    [sharedMd],
  )

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {section.md}
    </ReactMarkdown>
  )
}

function RulesWikiTocNav({ rows, activeId, onActivate, className }) {
  return (
    <nav className={className} aria-label="章节列表">
      {rows.map((row) => {
        const active = activeId === row.id
        const base = row.kind === 'part' ? 'rules-wiki-toc-part' : 'rules-wiki-toc-item'
        return (
          <button
            key={`${row.kind}-${row.id}`}
            type="button"
            title={row.kind === 'part' ? row.hint : undefined}
            className={`${base}${active ? ' is-active' : ''}`}
            onClick={() => onActivate(row.id)}
          >
            {row.label}
          </button>
        )
      })}
    </nav>
  )
}

export default function RulesWiki() {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  const contentScrollRef = useRef(null)
  const tocScrollRef = useRef(null)
  const observerRef = useRef(null)

  const sections = useMemo(
    () =>
      RULE_SECTIONS_RAW.map((s) => ({
        ...s,
        h2s: extractSectionH2Nav(s.id, s.md),
      })),
    [mdEncyclopedia, mdBeginner, mdCore, mdAdvanced, mdDetailed],
  )

  const sharedMd = useMemo(() => createSharedMdComponents(), [])

  const flatHeadings = useMemo(() => {
    const rows = []
    for (const s of sections) {
      rows.push({
        kind: 'part',
        id: s.id,
        label: s.title,
        hint: s.subtitle,
      })
      for (const h of s.h2s) {
        rows.push({
          kind: 'h2',
          id: h.id,
          label: h.title,
        })
      }
    }
    return rows
  }, [sections])

  const orderedNavIds = useMemo(() => flatHeadings.map((r) => r.id), [flatHeadings])

  const [activeId, setActiveId] = useState(() => orderedNavIds[0] ?? null)
  const [showScrollTopBtn, setShowScrollTopBtn] = useState(false)

  const scrollContentToId = useCallback((id) => {
    const root = contentScrollRef.current
    if (!root) return
    requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (!el) return
      const rootRect = root.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const target = root.scrollTop + elRect.top - rootRect.top - 16
      root.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
    })
  }, [])

  const scrollContentToTop = useCallback(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const root = contentScrollRef.current
    if (!root) return

    const handleScroll = () => {
      const st = root.scrollTop
      setShowScrollTopBtn(st >= SCROLL_TOP_BTN_SHOW_PX)
    }
    root.addEventListener('scroll', handleScroll, { passive: true })
    return () => root.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const root = contentScrollRef.current
    if (!root) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const visibleSet = new Set()
    let scheduled = false

    const updateActive = () => {
      if (visibleSet.size === 0) return
      let best = null
      let bestTop = Infinity
      for (const id of orderedNavIds) {
        if (visibleSet.has(id)) {
          const el = document.getElementById(id)
          if (el) {
            const top = el.getBoundingClientRect().top
            if (top < bestTop) {
              bestTop = top
              best = id
            }
          }
        }
      }
      if (best && best !== activeId) {
        setActiveId(best)
      }
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id) {
            if (entry.isIntersecting) {
              visibleSet.add(entry.target.id)
            } else {
              visibleSet.delete(entry.target.id)
            }
          }
        }
        if (!scheduled) {
          scheduled = true
          requestAnimationFrame(() => {
            scheduled = false
            updateActive()
          })
        }
      },
      {
        root: root,
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      },
    )

    for (const id of orderedNavIds) {
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
  }, [orderedNavIds, activeId])

  useEffect(() => {
    const nav = tocScrollRef.current
    if (!nav || !activeId) return
    const btn = nav.querySelector(`button.is-active`)
    if (btn) {
      btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeId])

  useEffect(() => {
    setActiveId((prev) =>
      orderedNavIds.includes(prev) ? prev : orderedNavIds[0] ?? null,
    )
  }, [orderedNavIds])

  const handleOpenPdf = async () => {
    if (!electron?.getResourcePath || !electron?.openPathInExplorer) return
    try {
      const base = await electron.getResourcePath()
      const pdfPath = joinResourcePath(base, 'docs', 'Rulebook_v9_official_en.pdf')
      const res = await electron.openPathInExplorer(pdfPath)
      if (!res.success) {
        window.alert(res.error || '无法打开 PDF。可在浏览器从 Konami 官网下载 Rulebook。')
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
    <div className="rules-wiki-page">
      <div className="rules-wiki-header">
        <h1 className="rules-wiki-page-title">
          <BookOpen size={20} />
          <span>规则百科</span>
        </h1>
        <Text className="rules-wiki-page-desc">
          游戏王打牌规则由浅入深：入门 → 基础 → 进阶 → 深入。细则以 Konami
          官方数据库为准。
        </Text>
      </div>

      <div className="rules-wiki-layout">
        <div className="rules-wiki-main">
          <ScrollArea
            ref={contentScrollRef}
            className="rules-wiki-article-scroll"
            viewportClassName="rules-wiki-article-viewport"
          >
            {showScrollTopBtn && (
              <Button
                className="rules-wiki-scroll-top-btn"
                onClick={scrollContentToTop}
                icon={<ChevronUp />}
                size="small"
                variant="filled"
              />
            )}
            <article className="rules-wiki-article">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="rules-wiki-part">
                  <MarkdownSection section={s} sharedMd={sharedMd} />
                </section>
              ))}
            </article>
          </ScrollArea>
        </div>

        <aside className="rules-wiki-rail">
          <ScrollArea
            ref={tocScrollRef}
            className="rules-wiki-toc-scroll"
            viewportClassName="rules-wiki-toc-viewport"
          >
            <div className="rules-wiki-toc-panel">
              <div className="rules-wiki-toc-header">
                <span className="rules-wiki-toc-title">目录</span>
              </div>
              <RulesWikiTocNav
                rows={flatHeadings}
                activeId={activeId}
                onActivate={scrollContentToId}
                className="rules-wiki-toc-nav"
              />
            </div>

            <div className="rules-wiki-info-panel">
              <div className="rules-wiki-info-header">
                <Link2 size={14} />
                <span>资料来源</span>
              </div>
              <Text className="rules-wiki-info-desc">
                竞技裁定以 Konami 官方数据库为准。
              </Text>
              <div className="rules-wiki-info-buttons">
                {RULE_REFERENCE_SOURCES.slice(0, 3).map((src) => (
                  <Button
                    key={src.id}
                    variant="text"
                    size="small"
                    block
                    className="rules-wiki-source-btn"
                    icon={<ExternalLink size={12} />}
                    onClick={() => openExternal(src.url)}
                  >
                    {src.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rules-wiki-info-panel">
              <div className="rules-wiki-info-header">
                <BookMarked size={14} />
                <span>官方规则书</span>
              </div>
              <div className="rules-wiki-info-buttons">
                <Button
                  variant="text"
                  size="small"
                  block
                  icon={<FileText size={12} />}
                  onClick={() => handleOpenPdf()}
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
                      'https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_en.pdf',
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
                    onClick={() => handleOpenDocsFolder()}
                  >
                    文档文件夹
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}
