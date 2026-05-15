import { useMemo } from 'react'
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
    const remarkPlugins = useMemo(
        () => [remarkGfm, remarkHeadingIds(section.id)],
        [section.id]
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
        [sharedMd]
    )

    return (
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
            {section.md}
        </ReactMarkdown>
    )
}
