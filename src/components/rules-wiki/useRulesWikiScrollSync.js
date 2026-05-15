import { useRef, useCallback, useEffect, useMemo } from 'react'
import {
  resolveActiveNavIdFromArticle,
  computeScrollTopForAnchor,
} from './headingScrollSync'
import { resolveSectionIdFromNav } from './utils'

/** 目录点击驱动正文滚动期间，禁止正文 scroll 回写目录 */
const TOC_DRIVEN_SCROLL_MS = 1200

/**
 * 规则百科正文 ↔ 目录双向联动
 */
export function useRulesWikiScrollSync({
  orderedNavIds,
  alignTop,
  getContentScrollElement,
  getArticleRoot,
  findScrollTarget,
  setActiveId,
  setExpandedSections,
  setShowScrollTopBtn,
  scrollTopShowPx,
}) {
  const lastActiveRef = useRef(null)
  const lastExpandedRef = useRef(null)
  const scrollModeRef = useRef('idle')
  const tocScrollEndTimerRef = useRef(null)
  const skipTocRailScrollRef = useRef(false)

  const validNavIds = useMemo(
    () => new Set(orderedNavIds),
    [orderedNavIds],
  )

  const isTocDriven = useCallback(() => scrollModeRef.current === 'toc-driven', [])

  const beginTocDrivenScroll = useCallback(() => {
    scrollModeRef.current = 'toc-driven'
    if (tocScrollEndTimerRef.current) {
      clearTimeout(tocScrollEndTimerRef.current)
    }
    tocScrollEndTimerRef.current = window.setTimeout(() => {
      scrollModeRef.current = 'idle'
      tocScrollEndTimerRef.current = null
    }, TOC_DRIVEN_SCROLL_MS)
  }, [])

  const endTocDrivenScrollSoon = useCallback(() => {
    if (tocScrollEndTimerRef.current) {
      clearTimeout(tocScrollEndTimerRef.current)
    }
    tocScrollEndTimerRef.current = window.setTimeout(() => {
      scrollModeRef.current = 'idle'
      tocScrollEndTimerRef.current = null
    }, 120)
  }, [])

  const pickActiveId = useCallback(
    (root) => {
      const article = getArticleRoot?.() ?? null
      if (article) {
        const id = resolveActiveNavIdFromArticle(
          article,
          root,
          alignTop,
          validNavIds,
        )
        if (id) return id
      }
      return orderedNavIds[0] ?? null
    },
    [alignTop, getArticleRoot, orderedNavIds, validNavIds],
  )

  const applyActiveHighlight = useCallback(
    (chosen) => {
      if (!chosen || chosen === lastActiveRef.current) return
      lastActiveRef.current = chosen
      setActiveId(chosen)

      const sectionId = resolveSectionIdFromNav(chosen)
      if (sectionId && sectionId !== lastExpandedRef.current) {
        lastExpandedRef.current = sectionId
        setExpandedSections((prev) =>
          prev[sectionId] ? prev : { ...prev, [sectionId]: true },
        )
      }
    },
    [setActiveId, setExpandedSections],
  )

  const scheduleRebuildOffsetCache = useCallback(() => {
    requestAnimationFrame(() => {
      const root = getContentScrollElement()
      if (root && !isTocDriven()) {
        applyActiveHighlight(pickActiveId(root))
      }
    })
  }, [
    applyActiveHighlight,
    getContentScrollElement,
    isTocDriven,
    pickActiveId,
  ])

  const rebuildOffsetCache = useCallback(() => {
    scheduleRebuildOffsetCache()
  }, [scheduleRebuildOffsetCache])

  useEffect(() => {
    scheduleRebuildOffsetCache()
    const onResize = () => scheduleRebuildOffsetCache()
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      if (tocScrollEndTimerRef.current) clearTimeout(tocScrollEndTimerRef.current)
    }
  }, [scheduleRebuildOffsetCache])

  const syncFromContentScroll = useCallback(() => {
    const root = getContentScrollElement()
    if (!root) return

    const st = root.scrollTop
    setShowScrollTopBtn((prev) => {
      const next = st >= scrollTopShowPx
      return prev === next ? prev : next
    })

    if (isTocDriven()) return

    const chosen = pickActiveId(root)
    applyActiveHighlight(chosen)
  }, [
    applyActiveHighlight,
    getContentScrollElement,
    isTocDriven,
    pickActiveId,
    scrollTopShowPx,
    setShowScrollTopBtn,
  ])

  const performScrollToId = useCallback(
    (id) => {
      const attempt = (tryCount = 0) => {
        const root = getContentScrollElement()
        const el = findScrollTarget(id)

        if (root && el) {
          const top = computeScrollTopForAnchor(root, el, alignTop)
          root.scrollTo({ top, behavior: 'smooth' })

          const onEnd = () => {
            endTocDrivenScrollSoon()
            scheduleRebuildOffsetCache()
          }

          if ('onscrollend' in root) {
            root.addEventListener('scrollend', onEnd, { once: true })
          } else {
            window.setTimeout(onEnd, 450)
          }
          return
        }

        if (tryCount < 60) {
          requestAnimationFrame(() => attempt(tryCount + 1))
        }
      }

      requestAnimationFrame(() => attempt())
    },
    [
      alignTop,
      endTocDrivenScrollSoon,
      findScrollTarget,
      getContentScrollElement,
      scheduleRebuildOffsetCache,
    ],
  )

  const scrollContentToId = useCallback(
    (id) => {
      beginTocDrivenScroll()
      skipTocRailScrollRef.current = true
      lastActiveRef.current = id
      setActiveId(id)

      const sectionId = resolveSectionIdFromNav(id)
      if (sectionId) {
        lastExpandedRef.current = sectionId
        setExpandedSections((prev) => ({ ...prev, [sectionId]: true }))
      }

      requestAnimationFrame(() => {
        scheduleRebuildOffsetCache()
        performScrollToId(id)
      })
    },
    [
      beginTocDrivenScroll,
      performScrollToId,
      scheduleRebuildOffsetCache,
      setActiveId,
      setExpandedSections,
    ],
  )

  const onContentScrollEnd = useCallback(() => {
    scheduleRebuildOffsetCache()
  }, [scheduleRebuildOffsetCache])

  const consumeSkipTocRailScroll = useCallback(() => {
    if (!skipTocRailScrollRef.current) return false
    skipTocRailScrollRef.current = false
    return true
  }, [])

  return {
    syncFromContentScroll,
    scrollContentToId,
    rebuildOffsetCache,
    scheduleRebuildOffsetCache,
    onContentScrollEnd,
    isTocDriven,
    consumeSkipTocRailScroll,
  }
}
