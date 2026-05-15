import { openExternalLink } from '../../utils/openExternalLink'

/**
 * 创建共享的 Markdown 渲染组件配置
 * @returns {Object} Markdown 组件配置对象
 */
export function useMarkdownComponents() {
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
        className="rules-wiki-a"
        onClick={(e) => {
          e.preventDefault()
          openExternalLink(href)
        }}
      >
        {children}
      </a>
    ),
    hr: () => <hr className="rules-wiki-hr" />,
  }
}
