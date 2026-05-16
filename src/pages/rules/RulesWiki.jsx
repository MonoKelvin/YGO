import {
    useMemo,
    useRef,
    useEffect,
    useLayoutEffect,
    useState,
    useCallback,
} from 'react'
import { ScrollArea, Button, DraggablePanel } from '@lobehub/ui'
import PageHeader from '../../components/layout/PageHeader'
import { ChevronUp, BookOpen } from 'lucide-react'
import {
    MarkdownPart,
    SidebarPanel,
    useMarkdownComponents,
    useRulesWikiScrollSync,
    extractSectionH2Nav,
    joinResourcePath,
    RULE_SECTIONS_RAW,
    RULES_WIKI_SCROLL_ALIGN_TOP,
    SCROLL_TOP_BTN_SHOW_PX,
} from '../../components/rules-wiki'
import './RulesWiki.css'

/**
 * 主组件：规则百科页面
 */
export default function RulesWiki() {
    const electron = typeof window !== 'undefined' ? window.electronAPI : null

    const articleViewportRef = useRef(null)
    const tocNavRef = useRef(null)

    const sections = useMemo(
        () =>
            RULE_SECTIONS_RAW.map((s) => ({
                ...s,
                h2s: extractSectionH2Nav(s.id, s.md),
            })),
        [],
    )

    const sharedMd = useMarkdownComponents()

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

    const orderedNavIds = useMemo(
        () => flatHeadings.map((r) => r.id),
        [flatHeadings],
    )

    const [activeId, setActiveId] = useState(() => orderedNavIds[0] ?? null)
    const [showScrollTopBtn, setShowScrollTopBtn] = useState(false)
    const [expandedSections, setExpandedSections] = useState(() => {
        const initial = {}
        if (sections.length > 0) {
            initial[sections[0].id] = true
        }
        return initial
    })

    const bindArticleViewport = useCallback((node) => {
        articleViewportRef.current = node
    }, [])

    const getContentScrollElement = useCallback(() => {
        const cached = articleViewportRef.current
        if (cached?.isConnected) return cached
        const el = document.querySelector(
            '[data-rules-wiki-article-viewport="true"]',
        )
        if (el) articleViewportRef.current = el
        return el
    }, [])

    const findScrollTarget = useCallback((id) => {
        const article = document.querySelector('.rules-wiki-article')
        if (!article) {
            return (
                document.getElementById(id) ||
                document.querySelector(`[data-rules-wiki-anchor="${id}"]`)
            )
        }

        if (!id.includes('__')) {
            const navEl = article.querySelector(
                `[data-rules-wiki-nav-id="${CSS.escape(id)}"]`,
            )
            if (navEl) return navEl

            const byAnchor = article.querySelector(
                `[data-rules-wiki-anchor="${CSS.escape(id)}"]`,
            )
            if (byAnchor) return byAnchor

            const part = article.querySelector(`#${CSS.escape(id)}`)
            if (part) {
                const h1 = part.querySelector('.rules-wiki-h1')
                return h1 || part
            }
        }

        return (
            article.querySelector(`#${CSS.escape(id)}`) ||
            article.querySelector(`[data-rules-wiki-anchor="${id}"]`) ||
            document.getElementById(id) ||
            document.querySelector(`[data-rules-wiki-anchor="${id}"]`)
        )
    }, [])

    const getArticleRoot = useCallback(
        () => document.querySelector('.rules-wiki-article'),
        [],
    )

    const {
        syncFromContentScroll,
        scrollContentToId,
        rebuildOffsetCache,
        scheduleRebuildOffsetCache,
        onContentScrollEnd,
        consumeSkipTocRailScroll,
    } = useRulesWikiScrollSync({
        orderedNavIds,
        alignTop: RULES_WIKI_SCROLL_ALIGN_TOP,
        getContentScrollElement,
        getArticleRoot,
        findScrollTarget,
        setActiveId,
        setExpandedSections,
        setShowScrollTopBtn,
        scrollTopShowPx: SCROLL_TOP_BTN_SHOW_PX,
    })

    const scrollContentToTop = useCallback(() => {
        const root = getContentScrollElement()
        root?.scrollTo({ top: 0, behavior: 'smooth' })
    }, [getContentScrollElement])

    const toggleSectionExpand = useCallback((sectionId) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }))
    }, [])

    const expandSection = useCallback((sectionId) => {
        setExpandedSections((prev) => ({ ...prev, [sectionId]: true }))
    }, [])

    /** 正文滚动：目录高亮 + 回到顶部按钮（合并为单监听器） */
    useEffect(() => {
        let disposed = false
        let root = null
        let ticking = false
        let persistIdle = null

        const persistScroll = () => {
            if (!root || persistIdle != null) return
            persistIdle = requestAnimationFrame(() => {
                persistIdle = null
                sessionStorage.setItem(
                    'ygo:rulesWikiArticleScroll',
                    String(root.scrollTop),
                )
            })
        }

        const onScroll = () => {
            if (!root || ticking) return
            ticking = true
            requestAnimationFrame(() => {
                ticking = false
                syncFromContentScroll()
                persistScroll()
            })
        }

        const onScrollEnd = () => {
            onContentScrollEnd()
            persistScroll()
        }

        const tryAttach = (attempt = 0) => {
            if (disposed) return
            root = getContentScrollElement()
            if (!root) {
                if (attempt < 48) {
                    requestAnimationFrame(() => tryAttach(attempt + 1))
                }
                return
            }

            const saved = sessionStorage.getItem('ygo:rulesWikiArticleScroll')
            if (saved != null) {
                const y = parseInt(saved, 10)
                if (!Number.isNaN(y)) root.scrollTop = y
            }

            root.addEventListener('scroll', onScroll, { passive: true })
            if ('onscrollend' in root) {
                root.addEventListener('scrollend', onScrollEnd, { passive: true })
            }

            rebuildOffsetCache()
            syncFromContentScroll()
        }

        tryAttach()

        return () => {
            disposed = true
            if (persistIdle != null) cancelAnimationFrame(persistIdle)
            if (root) {
                sessionStorage.setItem(
                    'ygo:rulesWikiArticleScroll',
                    String(root.scrollTop),
                )
                root.removeEventListener('scroll', onScroll)
                if ('onscrollend' in root) {
                    root.removeEventListener('scrollend', onScrollEnd)
                }
            }
        }
    }, [
        getContentScrollElement,
        syncFromContentScroll,
        onContentScrollEnd,
        rebuildOffsetCache,
    ])

    useLayoutEffect(() => {
        getContentScrollElement()
        scheduleRebuildOffsetCache()
        syncFromContentScroll()
        const root = getContentScrollElement()
        if (root) {
            setShowScrollTopBtn(root.scrollTop >= SCROLL_TOP_BTN_SHOW_PX)
        }

        const timer = window.setTimeout(rebuildOffsetCache, 400)
        return () => window.clearTimeout(timer)
    }, [
        orderedNavIds,
        scheduleRebuildOffsetCache,
        syncFromContentScroll,
        getContentScrollElement,
        rebuildOffsetCache,
    ])

    /** 正文驱动侧栏目录滚入可见；目录点击引起的变化不滚侧栏 */
    useEffect(() => {
        if (consumeSkipTocRailScroll()) return

        const nav = tocNavRef.current
        if (!nav || !activeId) return

        const target =
            nav.querySelector('button.rules-wiki-toc-item.is-active') ||
            nav.querySelector('.rules-wiki-toc-part-row.is-head-active')

        if (!target) return

        const railScroller = nav
            .closest('.rules-wiki-rail-scroll')
            ?.querySelector('[data-rules-wiki-toc-viewport="true"]')

        if (railScroller) {
            const scrollerRect = railScroller.getBoundingClientRect()
            const targetRect = target.getBoundingClientRect()
            const offset =
                targetRect.top - scrollerRect.top + railScroller.scrollTop
            const nextTop = Math.max(
                0,
                Math.min(
                    offset - scrollerRect.height * 0.35,
                    railScroller.scrollHeight - scrollerRect.height,
                ),
            )
            railScroller.scrollTo({ top: nextTop, behavior: 'smooth' })
            return
        }

        target.scrollIntoView({
            block: 'nearest',
            inline: 'nearest',
            behavior: 'smooth',
        })
    }, [activeId, consumeSkipTocRailScroll])

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

    return (
        <div className="rules-wiki-page ygo-page-shell ygo-page-shell--wide">
            <PageHeader
                className="rules-wiki-header"
                title="规则百科"
                icon={BookOpen}
                lead="开篇为「百科引言」（世界观、维基与官网、动画赛事与数据库外链）；其后为打牌规则，由浅入深。细则以 Konami 与数据库为准。"
            />

            <div className="rules-wiki-layout">
                <main className="rules-wiki-main" role="main">
                    <ScrollArea
                        flex={1}
                        className="rules-wiki-article-scroll"
                        contentProps={{
                            className: 'rules-wiki-article-scroll-inner',
                        }}
                        viewportProps={{
                            ref: bindArticleViewport,
                            'data-rules-wiki-article-viewport': 'true',
                        }}
                        tabIndex={0}
                        role="region"
                        aria-label="规则正文"
                        style={{ minHeight: 0, height: '100%', width: '100%' }}
                    >
                        {showScrollTopBtn && (
                            <div className="rules-wiki-scroll-top-float">
                                <Button
                                    variant="filled"
                                    size="small"
                                    className="rules-wiki-scroll-top-btn"
                                    onClick={scrollContentToTop}
                                    title="回到顶部"
                                >
                                    <ChevronUp size={18} strokeWidth={2} />
                                </Button>
                            </div>
                        )}

                        <article className="rules-wiki-article">
                            {sections.map((s) => (
                                <MarkdownPart
                                    key={s.id}
                                    section={s}
                                    sharedMd={sharedMd}
                                />
                            ))}
                        </article>
                    </ScrollArea>
                </main>

                <DraggablePanel
                    className="rules-wiki-draggable-panel"
                    placement="right"
                    pin
                    expandable
                    defaultExpand
                    defaultSize={{ width: 280 }}
                    minWidth={200}
                    maxWidth={400}
                    showBorder
                    backgroundColor="var(--color-bg-elevated)"
                >
                    <SidebarPanel
                        sections={sections}
                        activeId={activeId}
                        expandedSections={expandedSections}
                        onToggleSection={toggleSectionExpand}
                        onExpandSection={expandSection}
                        onScrollToId={scrollContentToId}
                        tocNavRef={tocNavRef}
                        onOpenPdf={handleOpenPdf}
                        onOpenDocsFolder={handleOpenDocsFolder}
                        hasElectron={!!electron?.getResourcePath}
                    />
                </DraggablePanel>
            </div>
        </div>
    )
}
