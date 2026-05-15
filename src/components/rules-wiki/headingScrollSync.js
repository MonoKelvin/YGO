/**
 * 按正文 DOM 顺序（[data-rules-wiki-nav-id]）解析当前应高亮的目录 id，
 * 避免「目录顺序」与「实际标题节点顺序」不一致时跳子章节。
 *
 * 规则：视口顶 + alignTop 为基准线；取基准线以下（含线上）的最后一个锚点。
 * 滚到底时取 DOM 中最后一个有效锚点。
 *
 * @param {HTMLElement|null} articleEl - .rules-wiki-article
 * @param {HTMLElement|null} scrollRoot - 实际滚动的视口
 * @param {number} alignTop
 * @param {Set<string>|string[]} validNavIds
 * @returns {string|null}
 */
export function resolveActiveNavIdFromArticle(
  articleEl,
  scrollRoot,
  alignTop,
  validNavIds,
) {
  if (!scrollRoot || !articleEl) return null

  const valid =
    validNavIds instanceof Set ? validNavIds : new Set(validNavIds)
  if (!valid.size) return null

  const nodes = articleEl.querySelectorAll('[data-rules-wiki-nav-id]')
  if (!nodes.length) return null

  const rootRect = scrollRoot.getBoundingClientRect()
  const anchorY = rootRect.top + alignTop
  const atBottom =
    scrollRoot.scrollTop + scrollRoot.clientHeight >=
    scrollRoot.scrollHeight - 10

  if (atBottom) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const id = nodes[i].getAttribute('data-rules-wiki-nav-id')
      if (id && valid.has(id)) return id
    }
  }

  let chosen = null
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i]
    const id = el.getAttribute('data-rules-wiki-nav-id')
    if (!id || !valid.has(id)) continue
    const top = el.getBoundingClientRect().top
    if (top <= anchorY + 1) {
      chosen = id
    }
  }

  const firstId = nodes[0]?.getAttribute('data-rules-wiki-nav-id')
  if (chosen) return chosen
  if (firstId && valid.has(firstId)) return firstId
  return null
}

/**
 * 计算 scrollTop，使锚点顶对齐视口顶部基准线
 */
export function computeScrollTopForAnchor(scrollRoot, el, alignTop) {
  const rootRect = scrollRoot.getBoundingClientRect()
  const topIn =
    el.getBoundingClientRect().top - rootRect.top + scrollRoot.scrollTop
  return Math.max(0, topIn - alignTop)
}
