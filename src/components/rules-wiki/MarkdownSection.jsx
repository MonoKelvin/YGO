import { useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { remarkHeadingIds } from './utils'

/**
 * Markdown 章节渲染组件
 * @param {Object} props
 * @param {Object} props.section - 章节数据
 * @param {string} props.section.id - 章节ID
 * @param {string} props.section.md - Markdown内容
 * @param {Object} props.sharedMd - 共享的Markdown组件配置
 */
export default function MarkdownSection({ section, sharedMd }) {
  /** 与 extractSectionH2Nav 相同顺序递增，保证目录 id 与正文锚点一致 */
  const h2IndexRef = useRef(0)
  h2IndexRef.current = 0

  const remarkPlugins = useMemo(
    () => [remarkGfm, remarkHeadingIds(section.id)],
    [section.id],
  )

  const components = useMemo(
    () => ({
      ...sharedMd,
      h1: ({ children }) => (
        <h1
          className="rules-wiki-h1"
          data-rules-wiki-anchor={section.id}
        >
          {children}
        </h1>
      ),
      h2: ({ children, className }) => {
        const id = `${section.id}__h${h2IndexRef.current++}`
        return (
          <h2
            id={id}
            data-rules-wiki-anchor={id}
            data-rules-wiki-nav-id={id}
            className={['rules-wiki-h2', className].filter(Boolean).join(' ')}
          >
            <span className="rules-wiki-h2-text">{children}</span>
          </h2>
        )
      },
      h3: ({ children }) => (
        <h3 className="rules-wiki-h3">{children}</h3>
      ),
    }),
    [sharedMd, section.id],
  )

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {section.md}
    </ReactMarkdown>
  )
}
