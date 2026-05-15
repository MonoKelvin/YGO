import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'

/**
 * 从 Markdown 内容中提取 H2 标题作为目录项
 * @param {string} sectionId - 章节ID
 * @param {string} md - Markdown内容
 * @returns {Array<{id: string, title: string}>}
 */
export function extractSectionH2Nav(sectionId, md) {
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

/**
 * Remark 插件：为 H2 标题添加 ID（与 extractSectionH2Nav 顺序一致）
 * @param {string} sectionId - 章节ID
 * @returns {Function}
 */
export function remarkHeadingIds(sectionId) {
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

/**
 * Rehype 插件：在 HTML AST 上为 H2 写入 id（react-markdown 锚点跳转更可靠）
 * @param {string} sectionId - 章节ID
 * @returns {Function}
 */
export function rehypeHeadingIds(sectionId) {
  return (tree) => {
    try {
      let i = 0
      visit(tree, 'element', (node) => {
        if (node.tagName !== 'h2') return
        node.properties ??= {}
        node.properties.id = `${sectionId}__h${i++}`
      })
    } catch (e) {
      console.error('[RulesWiki] rehypeHeadingIds', sectionId, e)
    }
  }
}

/**
 * 估算章节占位高度，减少懒加载时的布局跳动
 * @param {Object} section
 * @returns {number}
 */
export function estimateSectionMinHeight(section) {
  const h2Count = section.h2s?.length ?? 0
  const chars = section.md?.length ?? 0
  return Math.min(2200, Math.max(260, h2Count * 56 + chars / 100))
}

/**
 * 从目录/锚点 id 解析所属大章 id
 * @param {string} navId
 * @returns {string}
 */
export function resolveSectionIdFromNav(navId) {
  if (!navId) return ''
  const split = navId.split('__')
  return split.length > 1 ? split[0] : navId
}

/**
 * 路径拼接工具函数
 * @param {string} base - 基础路径
 * @param {...string} segments - 路径段
 * @returns {string}
 */
export function joinResourcePath(base, ...segments) {
  const sep = base.includes('\\') ? '\\' : '/'
  let s = base.replace(/[/\\]+$/, '')
  for (const seg of segments) {
    s += sep + seg.replace(/^[/\\]+/, '')
  }
  return s
}
