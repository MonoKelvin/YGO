import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import ExternalLink from '../../common/ExternalLink'
import {
    APP_DESCRIPTION,
    APP_NAME,
    APP_REPOSITORY_URL,
    APP_TAGLINE,
    APP_VERSION,
    IS_DEV_BUILD,
} from '../../../config/appMeta'
import { AI_DEV_TOOLS } from '../../../config/aiDevTools'

/**
 * 关于设置区块
 */
export default function AboutSection() {
    return [
        {
            name: 'appInfo',
            children: (
                <div className="about-content">
                    <div className="about-header">
                        <span className="about-app-name">{APP_NAME}</span>
                        <span className="about-version">
                            v{APP_VERSION}
                            {IS_DEV_BUILD && (
                                <span className="about-dev-tag" title="当前为开发构建"> · dev</span>
                            )}
                        </span>
                    </div>
                    <p className="about-tagline">{APP_TAGLINE}</p>
                    <p className="about-repo">
                        源码仓库：{' '}
                        <ExternalLink
                            href={APP_REPOSITORY_URL}
                            className="about-link settings-about-link"
                        >
                            {APP_REPOSITORY_URL.replace(/^https?:\/\//, '')}
                            <ExternalLinkIcon size={12} aria-hidden />
                        </ExternalLink>
                    </p>
                    <p className="about-desc">{APP_DESCRIPTION}</p>
                    <div className="about-ai-tools">
                        <div className="about-ai-tools-title">主要使用的 AI 工具</div>
                        <div className="about-ai-tools-links">
                            {AI_DEV_TOOLS.map((t) => (
                                <ExternalLink
                                    key={t.id}
                                    href={t.url}
                                    className="about-link about-ai-tool-link settings-about-link"
                                    title={t.hint}
                                >
                                    {t.name}
                                    <ExternalLinkIcon size={12} aria-hidden />
                                </ExternalLink>
                            ))}
                        </div>
                        <p className="about-ai-tools-hint">
                            Trae / Cursor / DeepSeek 等链接仅供跳转；具体服务条款以各官网为准。
                        </p>
                    </div>
                    <p className="about-credit">
                        卡牌画布排版参考开源项目{' '}
                        <ExternalLink
                            href="https://github.com/yamiyang/ygo-card"
                            className="about-link settings-about-link"
                        >
                            ygo-card
                            <ExternalLinkIcon size={12} aria-hidden />
                        </ExternalLink>{' '}
                        ；相关素材资源位于目录 <code className="about-code">assets/Mold</code>。
                    </p>
                </div>
            ),
        },
        {
            label: '开发者',
            name: 'developer',
            children: (
                <p className="about-muted">
                    本项目为爱好者作品，与科乐美（KONAMI）无关联。UI 与功能仍在迭代中。
                </p>
            ),
        },
        {
            label: '赞助与支持',
            name: 'sponsor',
            children: (
                <p className="about-muted">
                    若本项目对你有帮助，欢迎通过{' '}
                    <ExternalLink
                        href={`${APP_REPOSITORY_URL}/issues`}
                        className="about-link settings-about-link"
                    >
                        Issue / PR
                        <ExternalLinkIcon size={12} aria-hidden />
                    </ExternalLink>{' '}
                    参与改进；赞助方式见仓库 README。
                </p>
            ),
        },
    ]
}
