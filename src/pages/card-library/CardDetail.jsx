import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert, CopyButton, Tag, Button } from '@lobehub/ui'
import { ArrowLeft, ExternalLink as ExternalLinkIcon, Loader2 } from 'lucide-react'
import { fetchCardById } from '../../services/ygoprodeckApi'
import {
    getCardImageUrlLarge,
    isExtraDeckCard,
} from '../../config/ygoCardUtils'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import { openExternalLink } from '../../utils/openExternalLink'
import './CardDetail.css'

function formatStat(card) {
    const t = String(card.type || '')
    if (!/monster/i.test(t)) return null

    const atk = card.atk === undefined || card.atk === null ? '?' : card.atk
    const def = card.def === undefined || card.def === null ? '?' : card.def

    return (
        <div className="card-detail-stats-grid">
            {card.level != null && (
                <div className="card-detail-stat">
                    <span className="card-detail-stat-label">等级</span>
                    <span>★{card.level}</span>
                </div>
            )}
            {card.rank != null && (
                <div className="card-detail-stat">
                    <span className="card-detail-stat-label">阶级</span>
                    <span>{card.rank}</span>
                </div>
            )}
            {card.linkval != null && (
                <div className="card-detail-stat">
                    <span className="card-detail-stat-label">连接</span>
                    <span>LINK-{card.linkval}</span>
                </div>
            )}
            {card.scale != null && (
                <div className="card-detail-stat">
                    <span className="card-detail-stat-label">灵摆刻度</span>
                    <span>{card.scale}</span>
                </div>
            )}
            <div className="card-detail-stat">
                <span className="card-detail-stat-label">攻击力</span>
                <span>{atk}</span>
            </div>
            <div className="card-detail-stat">
                <span className="card-detail-stat-label">守备力</span>
                <span>{def}</span>
            </div>
        </div>
    )
}

/** 卡组快照等场景仅有精简字段，不足以展示详情 */
function isLikelySlimCard(row) {
    if (!row || typeof row !== 'object') return true
    if (row.desc != null && String(row.desc).trim() !== '') return false
    if (row.atk != null || row.def != null) return false
    if (Array.isArray(row.card_sets) && row.card_sets.length > 0) return false
    return true
}

export default function CardDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [card, setCard] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [partialNotice, setPartialNotice] = useState(false)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                setLoading(true)
                setError(null)
                setPartialNotice(false)
                setCard(null)

                const nid = Number(id)
                if (!Number.isFinite(nid)) {
                    setError('无效卡牌 id')
                    setLoading(false)
                    return
                }

                const passed = location.state?.card
                const passedOk =
                    passed &&
                    typeof passed === 'object' &&
                    Number(passed.id) === nid

                /** 1) 优先请求官方 API，拿到完整 desc / 攻防 / 卡包等 */
                try {
                    const apiRow = await fetchCardById(nid)
                    if (!cancelled && apiRow) {
                        setCard(apiRow)
                        setLoading(false)
                        return
                    }
                } catch {
                    /* 离线或 API 异常时走下方兜底 */
                }

                if (cancelled) return

                /** 2) 本地全库（卡牌数据库曾加载到内存的 cards） */
                const { cards } = useYgoDatabaseStore.getState()
                const fromLib = Array.isArray(cards)
                    ? cards.find((c) => c.id === nid || Number(c.id) === nid)
                    : null
                if (fromLib) {
                    setCard(fromLib)
                    setLoading(false)
                    return
                }

                /** 3) 路由传入的快照（卡组编辑器等），可能仅有 id/name/type */
                if (passedOk) {
                    setCard(passed)
                    setPartialNotice(isLikelySlimCard(passed))
                    setLoading(false)
                    return
                }

                setError(
                    '无法加载完整卡牌数据。请连接网络重试，或在「卡牌数据库」切换到本地全库并加载后再打开。',
                )
                setLoading(false)
            })()

        return () => {
            cancelled = true
        }
    }, [id, location.pathname, location.key])

    const imgUrl = card ? getCardImageUrlLarge(card) : ''

    return (
        <div className="card-detail-page">
            <div className="card-detail-toolbar">
                <Button
                    type="text"
                    variant="outlined"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate(-1)}
                    className="card-detail-back"
                >
                    返回
                </Button>
            </div>

            {loading && (
                <div className="card-detail-loading">
                    <Loader2 className="ygo-spin" size={40} aria-hidden />
                </div>
            )}

            {error && !loading && !card && (
                <div className="card-detail-error">{error}</div>
            )}

            {!loading && card && (
                <div className="card-detail-layout">
                    {partialNotice && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                            description={
                                <>
                                    <strong>
                                        当前为卡组缓存中的精简数据，攻防与效果等可能不完整
                                    </strong>
                                    <div style={{ marginTop: 8 }}>
                                        请联网打开本页，或在卡牌数据库使用本地全库后重新进入。
                                    </div>
                                </>
                            }
                        />
                    )}
                    <aside className="card-detail-visual">
                        <div className="card-detail-frame">
                            <img
                                src={imgUrl}
                                alt={card.name}
                                className="card-detail-img"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="card-detail-meta-badges">
                            <span className="card-detail-id-row">
                                <Tag color="blue">#{card.id}</Tag>
                                <CopyButton content={String(card.id)} title="复制卡牌编号" />
                            </span>
                            {isExtraDeckCard(card) && <Tag color="purple">额外卡组</Tag>}
                        </div>
                    </aside>

                    <main className="card-detail-main">
                        <header className="card-detail-header">
                            <h1 className="card-detail-title">{card.name}</h1>
                            <p className="card-detail-type-line">
                                <Tag>{card.type}</Tag>
                                {card.attribute && <Tag color="orange">{card.attribute}</Tag>}
                                {card.race && <Tag>{card.race}</Tag>}
                                {card.archetype && (
                                    <Tag color="geekblue">{card.archetype}</Tag>
                                )}
                            </p>
                        </header>

                        {formatStat(card)}

                        <section className="card-detail-block">
                            <h2 className="card-detail-section-title">效果文本</h2>
                            <div className="card-detail-desc">
                                {(card.desc || '（无效果文本）').split('\n').map((line, i) => (
                                    <p key={i}>{line || '\u00a0'}</p>
                                ))}
                            </div>
                        </section>

                        {Array.isArray(card.card_sets) && card.card_sets.length > 0 && (
                            <section className="card-detail-block card-detail-block-muted">
                                <h2 className="card-detail-section-title">收录卡包</h2>
                                <ul className="card-detail-set-list">
                                    {card.card_sets.slice(0, 12).map((s, i) => (
                                        <li key={i}>
                                            <span>{s.set_name}</span>
                                            <span className="card-detail-set-code">{s.set_code}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <a
                            href={`https://ygoprodeck.com/card/${card.id}`}
                            className="card-detail-ext-link"
                            onClick={(e) => {
                                e.preventDefault()
                                openExternalLink(`https://ygoprodeck.com/card/${card.id}`)
                            }}
                        >
                            在 YGOProDeck 查看
                            <ExternalLinkIcon size={14} />
                        </a>
                    </main>
                </div>
            )}
        </div>
    )
}
