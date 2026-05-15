import { Text, Button } from '@lobehub/ui'
import { ScrollArea } from '@lobehub/ui'
import { ExternalLink, Link2, FileText, FolderOpen, BookMarked } from 'lucide-react'
import TableOfContents from './TableOfContents'
import { RULE_REFERENCE_SOURCES } from '../../config/ruleSources'
import { openExternalLink } from '../../utils/openExternalLink'

/**
 * 侧边栏面板组件
 * @param {Object} props
 * @param {Array} props.sections - 章节列表
 * @param {string} props.activeId - 当前激活的ID
 * @param {Object} props.expandedSections - 展开的章节状态
 * @param {Function} props.onToggleSection - 切换章节展开/折叠
 * @param {Function} props.onScrollToId - 滚动到指定ID
 * @param {Object} props.tocNavRef - 目录导航引用
 * @param {Function} props.onOpenPdf - 打开PDF
 * @param {Function} props.onOpenDocsFolder - 打开文档文件夹
 * @param {boolean} props.hasElectron - 是否有Electron API
 */
export default function SidebarPanel({
    sections,
    activeId,
    expandedSections,
    onToggleSection,
    onScrollToId,
    tocNavRef,
    onOpenPdf,
    onOpenDocsFolder,
    hasElectron,
}) {
    const handleOpenExternal = (url) => {
        openExternalLink(url)
    }

    return (
        <aside className="rules-wiki-rail" aria-label="目录与资料">
            <ScrollArea
                className="rules-wiki-rail-scroll"
                contentProps={{ className: 'rules-wiki-rail-scroll-content' }}
            >
                <div className="rules-wiki-rail-inner">
                    {/* 目录面板 */}
                    <div className="rules-wiki-toc-panel">
                        <div className="rules-wiki-toc-title">
                            <BookMarked size={14} aria-hidden />
                            目录
                        </div>
                        <TableOfContents
                            sections={sections}
                            activeId={activeId}
                            expandedSections={expandedSections}
                            onToggleSection={onToggleSection}
                            onScrollToId={onScrollToId}
                            tocNavRef={tocNavRef}
                        />
                    </div>

                    {/* 资料来源面板 */}
                    <div className="rules-wiki-sources-panel">
                        <div className="rules-wiki-sources-title">
                            <Link2 size={14} aria-hidden />
                            资料来源
                        </div>
                        <Text as="p" className="rules-wiki-sources-intro">
                            以下为常用公开文档与仓库链接，点击在浏览器中打开。正文由应用整理，与第三方文档如有出入以
                            Konami 官方为准。
                        </Text>
                        <div className="rules-wiki-sources-buttons">
                            {RULE_REFERENCE_SOURCES.map((src) => (
                                <Button
                                    key={src.id}
                                    variant="outlined"
                                    size="small"
                                    block
                                    className="rules-wiki-source-btn"
                                    icon={<ExternalLink size={13} />}
                                    onClick={() => handleOpenExternal(src.url)}
                                >
                                    <span className="rules-wiki-source-btn-text">
                                        <span className="rules-wiki-source-label">{src.label}</span>
                                        <span className="rules-wiki-source-hint">{src.hint}</span>
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* 附加资料面板 */}
                    <div className="rules-wiki-appendix-panel">
                        <div className="rules-wiki-appendix-title">
                            <FileText size={14} aria-hidden />
                            附加资料（PDF）
                        </div>
                        <p className="rules-wiki-appendix-desc">
                            Konami 英文 Rulebook（如 v9）完整术语与图示，可与正文对照；官方页面亦可下载最新版。
                        </p>
                        <div className="rules-wiki-appendix-actions">
                            <Button
                                variant="outlined"
                                size="small"
                                icon={<FileText size={14} />}
                                onClick={onOpenPdf}
                                disabled={!hasElectron}
                            >
                                打开本地 PDF
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                icon={<ExternalLink size={14} />}
                                onClick={() =>
                                    handleOpenExternal(
                                        'https://www.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_en.pdf'
                                    )
                                }
                            >
                                浏览器下载 PDF
                            </Button>
                            {hasElectron && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    icon={<FolderOpen size={14} />}
                                    onClick={onOpenDocsFolder}
                                >
                                    文档文件夹
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </aside>
    )
}
