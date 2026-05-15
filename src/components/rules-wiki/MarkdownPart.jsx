import MarkdownSection from './MarkdownSection'

/**
 * 单章 Markdown 区块（全部挂载，靠 CSS content-visibility 优化绘制）
 */
export default function MarkdownPart({ section, sharedMd }) {
  return (
    <section
      id={section.id}
      className="rules-wiki-part is-loaded"
      data-rules-wiki-nav-id={section.id}
    >
      <div className="rules-wiki-md-column">
        <MarkdownSection section={section} sharedMd={sharedMd} />
      </div>
    </section>
  )
}
