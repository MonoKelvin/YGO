import {
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  forwardRef,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, ScrollArea, Text } from '@lobehub/ui'
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

const RULES_WIKI_SCROLL_ALIGN_TOP = 88
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
    ul: ({ children }) => (
      <ul className="rules-wiki-ul">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="rules-wiki-ol">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="rules-wiki-li">{children}</li>
    ),
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="rules-wiki-a"
      >
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
      h1: ({ children }) => (
        <h1 className="rules-wiki-h1">{children}</h1>
      ),
      h2: ({ children, id, className }) => (
        <h2
          id={id}
          className={['rules-wiki-h2', className].filter(Boolean).join(' ')}
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="rules-wiki-h3">{children}</h3>
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

const RulesWikiTocNav = forwardRef(function RulesWikiTocNav(
  { rows, activeId, onActivate, className },
  ref,
) {
  return (
    <nav ref={ref} className={className} aria-label="章节列表">
      {rows.map((row) => {
        const active = activeId === row.id
        const base =
          row.kind === 'part' ? 'rules-wiki-toc-part' : 'rules-wiki-toc-item'
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
})

function headingTopInScroller(el, scrollRoot) {
  return (
    el.getBoundingClientRect().top -
    scrollRoot.getBoundingClientRect().top +
    scrollRoot.scrollTop
  )
}

export default function RulesWiki() {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  const contentScrollRef = useRef(null)
  const tocNavRef = useRef(null)

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
        label: `${s.title}（${s.subtitle}）`,
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

  const orderedNavIds = useMemo(
    () => flatHeadings.map((r) => r.id),
    [flatHeadings],
  )

  const [activeId, setActiveId] = useState(() => orderedNavIds[0] ?? null)
  const [showScrollTopBtn, setShowScrollTopBtn] = useState(false)

  const syncActiveFromContentScroll = useCallback(() => {
    const root = contentScrollRef.current
    if (!root || !orderedNavIds.length) return
    const st = root.scrollTop
    const lead = RULES_WIKI_SCROLL_ALIGN_TOP
    let chosen = orderedNavIds[0]
    for (const id of orderedNavIds) {
      const el = document.getElementById(id)
      if (!el) continue
      const topIn = headingTopInScroller(el, root)
      if (topIn <= st + lead + 1) chosen = id
    }
    setActiveId((prev) => (prev === chosen ? prev : chosen))
  }, [orderedNavIds])

  const scrollContentToId = useCallback((id) => {
    const root = contentScrollRef.current
    const el = document.getElementById(id)
    if (!root || !el) return
    const run = () => {
      const topIn = headingTopInScroller(el, root)
      const target = Math.max(0, topIn - RULES_WIKI_SCROLL_ALIGN_TOP)
      root.scrollTo({ top: target, behavior: 'smooth' })
    }
    requestAnimationFrame(() => requestAnimationFrame(run))
  }, [])

  const scrollContentToTop = useCallback(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const root = contentScrollRef.current
    if (!root) return undefined
    const key = 'ygo:rulesWikiArticleScroll'
    const saved = sessionStorage.getItem(key)
    if (saved != null) {
      const y = parseInt(saved, 10)
      if (!Number.isNaN(y)) requestAnimationFrame(() => { root.scrollTop = y })
    }
    let idle = null
    const persist = () => {
      if (idle != null) cancelAnimationFrame(idle)
      idle = requestAnimationFrame(() => {
        idle = null
        sessionStorage.setItem(key, String(root.scrollTop))
      })
    }
    root.addEventListener('scroll', persist, { passive: true })
    return () => {
      if (idle != null) cancelAnimationFrame(idle)
      sessionStorage.setItem(key, String(root.scrollTop))
      root.removeEventListener('scroll', persist)
    }
  }, [])

  useEffect(() => {
    const root = contentScrollRef.current
    if (!root) return undefined
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        syncActiveFromContentScroll()
        const st = root.scrollTop
        setShowScrollTopBtn((prev) => {
          const next = st >= SCROLL_TOP_BTN_SHOW_PX
          return prev === next ? prev : next
        })
      })
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    syncActiveFromContentScroll()
    return () => root.removeEventListener('scroll', onScroll)
  }, [syncActiveFromContentScroll])

  useLayoutEffect(() => {
    syncActiveFromContentScroll()
    const root = contentScrollRef.current
    if (root) {
      setShowScrollTopBtn(root.scrollTop >= SCROLL_TOP_BTN_SHOW_PX)
    }
  }, [orderedNavIds, syncActiveFromContentScroll])

  useEffect(() => {
    const nav = tocNavRef.current
    if (!nav || !activeId) return
    const btn = nav.querySelector(`button.is-active`)
    btn?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
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
      const pdfPath = joinResourcePath(
        base,
        'docs',
        'Rulebook_v9_official_en.pdf',
      )
      const res = await electron.openPathInExplorer(pdfPath)
      if (!res.success) {
        window.alert(
          res.error ||
            '无法打开 PDF。可在浏览器从 Konami 官网下载 Rulebook。',
        )
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
      <div className="page-header">
        <h1 className="page-title">
          <BookOpen size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          规则百科
        </h1>
        <p className="page-description">
          开篇为「百科引言」（世界观、维基与官网、动画赛事与数据库外链）；其后为打牌规则，由浅入深。细则以 Konami 与数据库为准。
        </p>
      </div>

      <div className="rules-wiki-layout">
        <div className="rules-wiki-main">
          <ScrollArea
            ref={contentScrollRef}
            className="rules-wiki-article-scroll"
            tabIndex={0}
            role="region"
            aria-label="规则正文"
          >
            {showScrollTopBtn && (
              <div
                className="rules-wiki-scroll-top-float"
                aria-hidden={false}
              >
                <Button
                  variant="outlined"
                  size="small"
                  className="rules-wiki-scroll-top-btn"
                  onClick={scrollContentToTop}
                  title="正文回到顶部"
                  aria-label="正文回到顶部"
                >
                  <ChevronUp size={18} strokeWidth={2} />
                </Button>
              </div>
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

        <aside className="rules-wiki-rail" aria-label="目录与资料">
          <div className="rules-wiki-toc-panel">
            <div className="rules-wiki-toc-title">目录</div>
            <RulesWikiTocNav
              ref={tocNavRef}
              rows={flatHeadings}
              activeId={activeId}
              onActivate={scrollContentToId}
              className="rules-wiki-toc-nav"
            />
          </div>

          <div className="rules-wiki-sources-panel">
            <div className="rules-wiki-sources-title">
              <Link2 size={14} aria-hidden />
              资料来源
            </div>
            <Text as="p" className="rules-wiki-sources-intro">
              以下为常用公开文档与仓库链接，点击在浏览器中打开。正文由应用整理，与第三方文档如有出入以
              Konami 官方为准。
            </Text>
            <div className="rules-wiki-sources-buttons">
              {RULE_REFERENCE_SOURCES.map((src) => (
                <Button
                  key={src.id}
                  variant="outlined"
                  size="small"
                  block
                  className="rules-wiki-source-btn"
                  icon={<ExternalLink size={13} />}
                  onClick={() => openExternal(src.url)}
                >
                  <span className="rules-wiki-source-btn-text">
                    <span className="rules-wiki-source-label">{src.label}</span>
                    <span className="rules-wiki-source-hint">{src.hint}</span>
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="rules-wiki-appendix-panel">
            <div className="rules-wiki-appendix-title">
              <BookMarked size={14} aria-hidden />
              附加资料（PDF）
            </div>
            <p className="rules-wiki-appendix-desc">
              Konami 英文 Rulebook（如 v9）完整术语与图示，可与正文对照；官方页面亦可下载最新版。
            </p>
            <div className="rules-wiki-appendix-actions">
              <Button
                variant="outlined"
                size="small"
                icon={<FileText size={14} />}
                onClick={() => void handleOpenPdf()}
                disabled={!electron?.getResourcePath}
              >
                打开本地 PDF
              </Button>
              <Button
                variant="outlined"
                size="small"
                icon={<ExternalLink size={14} />}
                onClick={() =>
                  openExternal(
                    'https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_en.pdf',
                  )
                }
              >
                浏览器下载 PDF
              </Button>
              {electron?.getResourcePath && (
                <Button
                  variant="outlined"
                  size="small"
                  icon={<FolderOpen size={14} />}
                  onClick={() => void handleOpenDocsFolder()}
                >
                  文档文件夹
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
