import {
    useMemo,
    useRef,
    useEffect,
    useLayoutEffect,
    useState,
    useCallback,
} from 'react'
import { ScrollArea, Button } from '@lobehub/ui'
import { ChevronUp, BookOpen } from 'lucide-react'
import {
    MarkdownSection,
    SidebarPanel,
    useMarkdownComponents,
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
    // 获取 Electron API
    const electron = typeof window !== 'undefined' ? window.electronAPI : null

    // 滚动容器引用
    const contentScrollRef = useRef(null)
    const tocNavRef = useRef(null)

    // 解析章节和目录结构
    const sections = useMemo(
        () =>
            RULE_SECTIONS_RAW.map((s) => ({
                ...s,
                h2s: extractSectionH2Nav(s.id, s.md),
            })),
        []
    )

    // 共享的 Markdown 组件配置
    const sharedMd = useMarkdownComponents()

    // 扁平化的目录列表（包含章节和 H2 标题）
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

    // 有序的导航 ID 列表（用于滚动同步判断）
    const orderedNavIds = useMemo(
        () => flatHeadings.map((r) => r.id),
        [flatHeadings]
    )

    // 状态管理
    const [activeId, setActiveId] = useState(() => orderedNavIds[0] ?? null)
    const [showScrollTopBtn, setShowScrollTopBtn] = useState(false)
    const [expandedSections, setExpandedSections] = useState(() => {
        const initial = {}
        if (sections.length > 0) {
            initial[sections[0].id] = true
        }
        return initial
    })

    /**
     * 获取内容滚动元素
     */
    const getContentScrollElement = useCallback(() => {
        if (!contentScrollRef.current) return null
        const container = contentScrollRef.current

        // 尝试多种方式找到滚动元素
        let scrollEl = null

        // 方法1: 查找具有 overflow-y 或 overflow 属性的元素
        const allDivs = container.querySelectorAll('div')
        for (const div of allDivs) {
            const style = window.getComputedStyle(div)
            if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                style.overflow === 'auto' || style.overflow === 'scroll') {
                scrollEl = div
                break
            }
        }

        // 方法2: 如果没找到，尝试第一个子元素
        if (!scrollEl && container.children.length > 0) {
            scrollEl = container.children[0]
        }

        // 方法3: 如果还没找到，使用容器本身
        if (!scrollEl) {
            scrollEl = container
        }

        return scrollEl
    }, [])

    /**
     * 计算元素在滚动容器中的顶部位置
     */
    const headingTopInScroller = useCallback((el, scrollRoot) => {
        return (
            el.getBoundingClientRect().top -
            scrollRoot.getBoundingClientRect().top +
            scrollRoot.scrollTop
        )
    }, [])

    /**
     * 从内容滚动位置同步更新当前激活的目录项
     */
    const syncActiveFromContentScroll = useCallback(() => {
        const root = getContentScrollElement()
        if (!root || !orderedNavIds.length) return

        const st = root.scrollTop
        const lead = RULES_WIKI_SCROLL_ALIGN_TOP

        let chosen = orderedNavIds[0]
        // 从后往前遍历，找到最接近视口顶部的标题
        for (let i = orderedNavIds.length - 1; i >= 0; i--) {
            const id = orderedNavIds[i]
            const el = document.getElementById(id)
            if (!el) continue
            const topIn = headingTopInScroller(el, root)
            if (topIn <= st + lead) {
                chosen = id
                break
            }
        }

        setActiveId((prev) => (prev === chosen ? prev : chosen))

        // 自动展开当前激活章节的子目录
        const currentSectionId = sections.find((s) => chosen.startsWith(s.id))?.id
        if (currentSectionId) {
            setExpandedSections((prev) => ({ ...prev, [currentSectionId]: true }))
        }
    }, [orderedNavIds, sections, getContentScrollElement, headingTopInScroller])

    /**
     * 滚动内容区域到指定 ID 的元素
     */
    const scrollContentToId = useCallback((id) => {
        const root = getContentScrollElement()
        const el = document.getElementById(id)
        if (!root || !el) return

        const run = () => {
            const topIn = headingTopInScroller(el, root)
            const target = Math.max(0, topIn - RULES_WIKI_SCROLL_ALIGN_TOP)
            root.scrollTo({ top: target, behavior: 'smooth' })
        }

        requestAnimationFrame(() => requestAnimationFrame(run))
    }, [getContentScrollElement, headingTopInScroller])

    /**
     * 滚动内容区域到顶部
     */
    const scrollContentToTop = useCallback(() => {
        const root = getContentScrollElement()
        root?.scrollTo({ top: 0, behavior: 'smooth' })
    }, [getContentScrollElement])

    /**
     * 切换章节的展开/折叠状态
     */
    const toggleSectionExpand = useCallback((sectionId) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }))
    }, [])

    /**
     * 持久化滚动位置（会话存储）
     */
    useEffect(() => {
        const root = getContentScrollElement()
        if (!root) return undefined

        const key = 'ygo:rulesWikiArticleScroll'
        const saved = sessionStorage.getItem(key)

        if (saved != null) {
            const y = parseInt(saved, 10)
            if (!Number.isNaN(y)) {
                requestAnimationFrame(() => {
                    root.scrollTop = y
                })
            }
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
    }, [getContentScrollElement])

    /**
     * 监听内容滚动，同步更新目录高亮
     */
    useEffect(() => {
        const root = getContentScrollElement()
        if (!root) {
            console.warn('[RulesWiki] 无法获取滚动元素')
            return undefined
        }

        console.log('[RulesWiki] 滚动监听器已绑定到:', root)

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

        return () => {
            console.log('[RulesWiki] 滚动监听器已移除')
            root.removeEventListener('scroll', onScroll)
        }
    }, [syncActiveFromContentScroll, getContentScrollElement])

    /**
     * 在目录结构变化时重新同步
     */
    useLayoutEffect(() => {
        syncActiveFromContentScroll()
        const root = getContentScrollElement()
        if (root) {
            setShowScrollTopBtn(root.scrollTop >= SCROLL_TOP_BTN_SHOW_PX)
        }
    }, [orderedNavIds, syncActiveFromContentScroll, getContentScrollElement])

    /**
     * 当激活项变化时，自动滚动目录导航到可见区域
     */
    useEffect(() => {
        const nav = tocNavRef.current
        if (!nav || !activeId) return

        const btn = nav.querySelector(`button.is-active`)
        if (btn) {
            btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
    }, [activeId])

    /**
     * 确保激活项始终在有效范围内
     */
    useEffect(() => {
        setActiveId((prev) =>
            orderedNavIds.includes(prev) ? prev : orderedNavIds[0] ?? null
        )
    }, [orderedNavIds])

    /**
     * 打开本地 PDF 文件
     */
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

    /**
     * 打开文档文件夹
     */
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
        <div className="rules-wiki-page">
            {/* 标题区域 */}
            <header className="rules-wiki-header">
                <div className="rules-wiki-header-content">
                    <div className="rules-wiki-title-row">
                        <BookOpen className="rules-wiki-title-icon" size={24} />
                        <h1 className="rules-wiki-title">规则百科</h1>
                    </div>
                    <p className="rules-wiki-lead">
                        开篇为「百科引言」（世界观、维基与官网、动画赛事与数据库外链）；其后为打牌规则，由浅入深。细则以 Konami 与数据库为准。
                    </p>
                </div>
            </header>

            {/* 主体内容区域 */}
            <div className="rules-wiki-layout">
                {/* 主内容区域 */}
                <main className="rules-wiki-main" role="main">
                    <ScrollArea
                        ref={contentScrollRef}
                        className="rules-wiki-article-scroll"
                        tabIndex={0}
                        role="region"
                        aria-label="规则正文"
                    >
                        {/* 回到顶部按钮 */}
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

                        {/* 文章内容 */}
                        <article className="rules-wiki-article">
                            {sections.map((s) => (
                                <section
                                    key={s.id}
                                    id={s.id}
                                    className="rules-wiki-part"
                                >
                                    <MarkdownSection section={s} sharedMd={sharedMd} />
                                </section>
                            ))}
                        </article>
                    </ScrollArea>
                </main>

                {/* 侧边栏区域（目录与资料） */}
                <SidebarPanel
                    sections={sections}
                    activeId={activeId}
                    expandedSections={expandedSections}
                    onToggleSection={toggleSectionExpand}
                    onScrollToId={scrollContentToId}
                    tocNavRef={tocNavRef}
                    onOpenPdf={handleOpenPdf}
                    onOpenDocsFolder={handleOpenDocsFolder}
                    hasElectron={!!electron?.getResourcePath}
                />
            </div>
        </div>
    )
}
