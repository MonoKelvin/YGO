import { Card } from 'antd'
import { openExternalLink } from '../../utils/openExternalLink'

/**
 * 创建共享的 Markdown 渲染组件配置
 * @returns {Object} Markdown 组件配置对象
 */
export function useMarkdownComponents() {
  return {
    p: ({ children }) => <p className="rules-wiki-p">{children}</p>,
    strong: ({ children }) => <strong className="rules-wiki-strong">{children}</strong>,
    b: ({ children }) => <strong className="rules-wiki-strong">{children}</strong>,
    em: ({ children }) => <em className="rules-wiki-em">{children}</em>,
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
      <blockquote className="rules-wiki-quote">
        <Card
          variant="outlined"
          size="small"
          className="rules-wiki-quote-card"
          styles={{
            body: {
              padding: 'var(--spacing-md) var(--spacing-lg)',
              paddingTop: 'calc(var(--spacing-md) + 8px)',
            },
          }}
        >
          <div className="rules-wiki-quote-inner">{children}</div>
        </Card>
      </blockquote>
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
    thead: ({ children }) => <thead className="rules-wiki-thead">{children}</thead>,
    tbody: ({ children }) => <tbody className="rules-wiki-tbody">{children}</tbody>,
    tr: ({ children }) => <tr className="rules-wiki-tr">{children}</tr>,
    th: ({ children }) => <th className="rules-wiki-th">{children}</th>,
    td: ({ children }) => <td className="rules-wiki-td">{children}</td>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="rules-wiki-a"
        onClick={(e) => {
          e.preventDefault()
          openExternalLink(href)
        }}
      >
        <span className="rules-wiki-a-text">{children}</span>
      </a>
    ),
    hr: () => <hr className="rules-wiki-hr" />,
    del: ({ children }) => <del className="rules-wiki-del">{children}</del>,
    img: ({ src, alt, title }) => (
      <img
        className="rules-wiki-md-img"
        src={src}
        alt={alt ?? ''}
        title={title}
        loading="lazy"
        decoding="async"
      />
    ),
  }
}
