import { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import {
    Button,
    Flexbox,
    Form,
    Input,
    InputNumber,
    ScrollArea,
    TextArea,
    Tooltip,
    toast,
} from '@lobehub/ui'
import { Select } from '@lobehub/ui/base-ui'
import {
    AlertTriangle,
    FileText,
    GaugeCircle,
    Home,
    IdCard,
    Image as ImageIcon,
    RotateCcw,
    Save,
    Shield,
    Sparkles,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import CardPreviewPanel from './CardPreviewPanel'
import useCardStore from '../../store/useStore'
import {
    absolutePathToFileUrl,
    fileUrlToDisplayPath,
    isHttpImageUrl,
    probeImageUrl,
} from '../../utils/cardIllustrationActions'
import {
    CARD_TYPES,
    ATTRIBUTES,
    RACES,
    DEFAULT_CARD,
    MONSTER_CATEGORIES,
    SPELL_CARD_TYPES,
    TRAP_CARD_TYPES,
    normalizeCard,
} from '../../config/cardConstants'
import { CARD_NAME_CHAR_HARD_CAP } from '../../config/cardLayout'
import './CardGenerator.css'

export default function CardGenerator() {
    const currentCard = useCardStore((s) => s.currentCard)
    const setCurrentCard = useCardStore((s) => s.setCurrentCard)
    const addCard = useCardStore((s) => s.addCard)
    const resetCurrentCard = useCardStore((s) => s.resetCurrentCard)
    const cardGenerator = useCardStore((s) => s.cardGenerator)
    const setCardGeneratorState = useCardStore((s) => s.setCardGeneratorState)
    const formLoadRevision = useCardStore((s) => s.cardGenerator.formLoadRevision ?? 0)

    const formData = cardGenerator.formData
    const previewVisible = cardGenerator.previewVisible
    const autoRefresh = cardGenerator.autoRefresh
    const [frozenPreviewCard, setFrozenPreviewCard] = useState(null)
    const illustrationFileRef = useRef(null)
    const [illustrationUrlDraft, setIllustrationUrlDraft] = useState('')
    const [illustrationMode, setIllustrationMode] = useState('local')
    const [illustrationUrlError, setIllustrationUrlError] = useState(false)
    const [localPathTruncated, setLocalPathTruncated] = useState(false)
    const formDataRef = useRef(formData)
    const autoRefreshRef = useRef(autoRefresh)
    const urlDebounceTimerRef = useRef(null)
    const localInputWrapRef = useRef(null)
    const urlValidateSeqRef = useRef(0)

    const previewCard = useMemo(() => {
        const base = autoRefresh ? formData : frozenPreviewCard ?? formData
        const merged = {
            ...base,
            imagePath: formData.imagePath,
            imageDisplayPath: formData.imageDisplayPath,
        }
        return normalizeCard(merged)
    }, [autoRefresh, formData, frozenPreviewCard])

    /** 进入生成器且开启自动刷新时，将全局预览卡与表单默认值对齐 */
    useEffect(() => {
        const s = useCardStore.getState()
        if (!s.cardGenerator.autoRefresh) {
            return
        }
        setCurrentCard(normalizeCard(s.cardGenerator.formData))
    }, [setCurrentCard])

    const setFormData = useCallback((data) => setCardGeneratorState({ formData: data }), [setCardGeneratorState])
    const setPreviewVisible = useCallback((value) => setCardGeneratorState({ previewVisible: value }), [setCardGeneratorState])
    const setAutoRefresh = useCallback((value) => setCardGeneratorState({ autoRefresh: value }), [setCardGeneratorState])

    useEffect(() => {
        formDataRef.current = formData
        autoRefreshRef.current = autoRefresh
    }, [formData, autoRefresh])

    useEffect(() => {
        if (isHttpImageUrl(formData.imagePath)) {
            setIllustrationUrlDraft(formData.imagePath)
        } else if (!formData.imagePath) {
            setIllustrationUrlDraft('')
        }
    }, [formData.imagePath])

    /** 生成器表单不与全局 currentCard 自动同步，避免图库选中卡覆盖此处默认值；外部载入由 loadCardIntoGenerator + formLoadRevision 触发。 */
    useEffect(() => {
      if (formLoadRevision === 0) {
        return
      }
      const data = useCardStore.getState().cardGenerator.formData
      setFrozenPreviewCard(null)
      setIllustrationUrlError(false)
      if (isHttpImageUrl(data.imagePath)) {
        setIllustrationMode('url')
        setIllustrationUrlDraft(data.imagePath)
      } else {
        setIllustrationMode('local')
        setIllustrationUrlDraft('')
      }
    }, [formLoadRevision])

    const handleChange = useCallback(
        (field, value) => {
            const patch = { ...formData, [field]: value }
            const newData = normalizeCard(patch)
            setFormData(newData)
            if (autoRefresh) {
                setCurrentCard(newData)
            }
        },
        [formData, setCurrentCard, autoRefresh, setFormData],
    )

    const handleSave = useCallback(async () => {
        if (!formData.name.trim()) {
            toast.warning({
                title: '无法保存',
                description: '请先填写卡牌名称。',
            })
            return
        }

        const api = typeof window !== 'undefined' ? window.electronAPI : undefined
        const defaultFileName = formData.name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'card'
        const dlg = await api?.saveFileDialog?.({
            title: '保存卡牌图片',
            defaultPath: `${defaultFileName}.png`,
            filters: [{ name: 'PNG 图片', extensions: ['png'] }],
        })
        if (!dlg || dlg.canceled || !dlg.filePath) {
            return
        }
        const filePath = dlg.filePath

        const canvas = document.querySelector('canvas.card-generator-export-canvas')
        if (!canvas || typeof canvas.toDataURL !== 'function') {
            toast.error({
                title: '导出失败',
                description: '未找到生成器预览画布，请稍后重试。',
            })
            return
        }

        let base64 = ''
        try {
            const dataUrl = canvas.toDataURL('image/png')
            base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
        } catch (err) {
            console.error('[CardGenerator] toDataURL failed', err)
            toast.error({
                title: '导出失败',
                description:
                    err?.name === 'SecurityError'
                        ? '画布包含受跨域限制的插图，无法导出 PNG。请改用本地插图或允许 CORS 的图片来源。'
                        : (err?.message || '无法读取画布像素。'),
            })
            return
        }

        if (!api?.writeFile) {
            toast.error({
                title: '保存失败',
                description: '当前环境不支持将文件写入磁盘。',
            })
            return
        }

        /** 主进程 `write-file` 使用 `Buffer.from(data, 'base64')`，须传纯 base64 字符串（勿传 Buffer，IPC 序列化会异常） */
        const writeRes = await api.writeFile(filePath, base64)
        if (!writeRes?.success) {
            toast.error({
                title: '保存失败',
                description: writeRes?.error || '写入 PNG 文件失败。',
            })
            return
        }

        addCard({
            ...formData,
            imagePath: filePath,
            imageDisplayPath: filePath,
        })
        resetCurrentCard()
        setFrozenPreviewCard(null)
        setFormData(normalizeCard({ ...DEFAULT_CARD }))
        toast.success({
            title: '已保存',
            description: '图片已写入所选路径，并已加入「卡牌浏览」列表。',
        })
    }, [formData, addCard, resetCurrentCard, setFormData])

    const handleReset = useCallback(() => {
        resetCurrentCard()
        setFrozenPreviewCard(null)
        setFormData(normalizeCard({ ...DEFAULT_CARD }))
    }, [resetCurrentCard, setFormData])

    const handleToggleAutoRefresh = useCallback(() => {
        if (autoRefresh) {
            setFrozenPreviewCard(normalizeCard({ ...formData }))
            setAutoRefresh(false)
        } else {
            setFrozenPreviewCard(null)
            setAutoRefresh(true)
            setCurrentCard(normalizeCard(formData))
        }
    }, [autoRefresh, formData, setAutoRefresh, setCurrentCard])

    const pickIllustrationFile = useCallback(async () => {
        const api = window.electronAPI
        if (api?.openFileDialog) {
            const res = await api.openFileDialog({
                filters: [
                    {
                        name: '图片',
                        extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'],
                    },
                ],
            })
            if (res?.canceled || !res?.filePaths?.[0]) {
                return
            }
            const abs = res.filePaths[0]
            const fileUrl = absolutePathToFileUrl(abs)
            const next = normalizeCard({
                ...formData,
                imagePath: fileUrl,
                imageDisplayPath: abs,
            })
            setIllustrationUrlError(false)
            setFormData(next)
            if (autoRefresh) {
                setCurrentCard(next)
            }
            return
        }
        illustrationFileRef.current?.click()
    }, [autoRefresh, formData, setCurrentCard, setFormData])

    const handleIllustrationNativeFileChange = useCallback(
        (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) {
                return
            }
            const reader = new FileReader()
            reader.onload = (ev) => {
                const next = normalizeCard({
                    ...formData,
                    imagePath: ev.target?.result,
                    imageDisplayPath: file.name ? `本地：${file.name}` : '',
                })
                setIllustrationUrlError(false)
                setFormData(next)
                if (autoRefresh) {
                    setCurrentCard(next)
                }
            }
            reader.readAsDataURL(file)
        },
        [autoRefresh, formData, setCurrentCard, setFormData],
    )

    const clearIllustration = useCallback(() => {
        const next = normalizeCard({
            ...formData,
            imagePath: '',
            imageDisplayPath: '',
        })
        setFormData(next)
        setIllustrationUrlDraft('')
        setIllustrationUrlError(false)
        if (autoRefresh) {
            setCurrentCard(next)
        }
    }, [autoRefresh, formData, setCurrentCard, setFormData])

    const localIllustrationDisplayText = useMemo(() => {
        if (formData.imageDisplayPath) {
            return formData.imageDisplayPath
        }
        if (formData.imagePath?.startsWith('file:')) {
            return fileUrlToDisplayPath(formData.imagePath) || ''
        }
        if (formData.imagePath?.startsWith('data:')) {
            return formData.imageDisplayPath || '（已嵌入本地图片）'
        }
        return ''
    }, [formData.imageDisplayPath, formData.imagePath])

    const localPathTooltipTitle = useMemo(() => {
        if (!localIllustrationDisplayText) {
            return ''
        }
        if (formData.imageDisplayPath) {
            return formData.imageDisplayPath
        }
        if (formData.imagePath?.startsWith('file:')) {
            return fileUrlToDisplayPath(formData.imagePath) || localIllustrationDisplayText
        }
        if (formData.imagePath?.startsWith('data:')) {
            return '当前为浏览器嵌入图片，无磁盘路径'
        }
        return ''
    }, [
        formData.imageDisplayPath,
        formData.imagePath,
        localIllustrationDisplayText,
    ])

    /** URL 插图：校验并写回表单（无 toast，仅用红框表示失败） */
    const validateUrlImageAndCommit = useCallback(
        async (vRaw) => {
            const seq = ++urlValidateSeqRef.current
            const v = String(vRaw || '').trim()
            const fd = formDataRef.current
            if (!v) {
                if (seq !== urlValidateSeqRef.current) {
                    return
                }
                setIllustrationUrlError(false)
                if (isHttpImageUrl(fd.imagePath)) {
                    const next = normalizeCard({
                        ...fd,
                        imagePath: '',
                        imageDisplayPath: '',
                    })
                    setFormData(next)
                    if (autoRefreshRef.current) {
                        setCurrentCard(next)
                    }
                }
                return
            }
            if (!isHttpImageUrl(v)) {
                if (seq !== urlValidateSeqRef.current) {
                    return
                }
                setIllustrationUrlError(true)
                return
            }
            try {
                await probeImageUrl(v)
                if (seq !== urlValidateSeqRef.current) {
                    return
                }
                setIllustrationUrlError(false)
                const next = normalizeCard({
                    ...fd,
                    imagePath: v,
                    imageDisplayPath: v,
                })
                setFormData(next)
                if (autoRefreshRef.current) {
                    setCurrentCard(next)
                }
            } catch {
                if (seq !== urlValidateSeqRef.current) {
                    return
                }
                setIllustrationUrlError(true)
            }
        },
        [setFormData, setCurrentCard],
    )

    useEffect(() => {
        if (illustrationMode !== 'url') {
            return
        }
        if (urlDebounceTimerRef.current) {
            clearTimeout(urlDebounceTimerRef.current)
        }
        urlDebounceTimerRef.current = setTimeout(() => {
            urlDebounceTimerRef.current = null
            void validateUrlImageAndCommit(illustrationUrlDraft)
        }, 420)
        return () => {
            if (urlDebounceTimerRef.current) {
                clearTimeout(urlDebounceTimerRef.current)
                urlDebounceTimerRef.current = null
            }
        }
    }, [illustrationMode, illustrationUrlDraft, validateUrlImageAndCommit])

    useLayoutEffect(() => {
        if (illustrationMode !== 'local') {
            setLocalPathTruncated(false)
            return
        }
        const wrap = localInputWrapRef.current
        const input = wrap?.querySelector?.('input')
        if (!input || !localIllustrationDisplayText) {
            setLocalPathTruncated(false)
            return
        }
        const raf = requestAnimationFrame(() => {
            const el = localInputWrapRef.current?.querySelector?.('input')
            if (!el) {
                return
            }
            setLocalPathTruncated(el.scrollWidth > el.clientWidth + 1)
        })
        return () => cancelAnimationFrame(raf)
    }, [illustrationMode, localIllustrationDisplayText])

    const flushUrlValidate = useCallback(() => {
        if (urlDebounceTimerRef.current) {
            clearTimeout(urlDebounceTimerRef.current)
            urlDebounceTimerRef.current = null
        }
        void validateUrlImageAndCommit(illustrationUrlDraft)
    }, [illustrationUrlDraft, validateUrlImageAndCommit])

    const handlePasswordInput = useCallback(
        (e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
            handleChange('password', digits)
        },
        [handleChange],
    )

    const raceOptions = useMemo(
        () => RACES.map((r) => ({ value: r, label: r })),
        [],
    )

    const isMonster = formData.cardType === 'monster'
    const isSpell = formData.cardType === 'spell'
    const isTrap = formData.cardType === 'trap'
    const isLink = isMonster && formData.monsterCategory === 'link'
    const isXyz = isMonster && formData.monsterCategory === 'xyz'
    const isPendulum = isMonster && formData.monsterCategory === 'pendulum'

    const levelLabel = isXyz ? '阶级' : '等级'

    const handleIllustrationModeChange = useCallback((value) => {
        if (urlDebounceTimerRef.current) {
            clearTimeout(urlDebounceTimerRef.current)
            urlDebounceTimerRef.current = null
        }
        setIllustrationMode(value === 'url' ? 'url' : 'local')
        setIllustrationUrlError(false)
    }, [])

    const effectPlaceholder = useMemo(() => {
        if (isPendulum) {
            return '怪兽效果与灵摆效果可用连续空行分段（上：怪兽文本 / 下：灵摆文本）'
        }
        return '输入卡牌效果（可为空）'
    }, [isPendulum])

    const items = useMemo(() => {
        /** Form 默认除首项外带 divider（FormDivider）；统一关掉以去掉组内表单项之间的横线 */
        const noItemDividers = (rows) => rows.map((row) => ({ ...row, divider: false }))

        const basicChildren = [
            {
                label: '卡牌名称',
                name: 'name',
                children: (
                    <Input
                        variant="outlined"
                        value={formData.name}
                        maxLength={CARD_NAME_CHAR_HARD_CAP}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="卡牌名称"
                    />
                ),
            },
            {
                label: '卡牌密码',
                name: 'password',
                children: (
                    <Input
                        variant="outlined"
                        value={formData.password}
                        inputMode="numeric"
                        maxLength={8}
                        onChange={handlePasswordInput}
                        placeholder="8 位数字（可空）"
                    />
                ),
            },
            {
                label: '选择插图',
                name: 'illustration',
                children: (
                    <Flexbox vertical gap={8} className="card-generator-illustration-block">
                        <div className="card-generator-illustration-combo">
                            <Select
                                variant="outlined"
                                className="card-generator-illustration-mode-select"
                                value={illustrationMode}
                                onChange={handleIllustrationModeChange}
                                options={[
                                    { value: 'local', label: '本地' },
                                    { value: 'url', label: 'URL' },
                                ]}
                                style={{ width: 88, flexShrink: 0 }}
                            />
                            <Flexbox
                                horizontal
                                align="center"
                                className="card-generator-illustration-input-row"
                                gap={4}
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                {illustrationMode === 'local' ? (
                                    <Tooltip
                                        title={
                                            localPathTruncated && localPathTooltipTitle
                                                ? localPathTooltipTitle
                                                : undefined
                                        }
                                        mouseEnterDelay={0.35}
                                    >
                                        <span
                                            ref={localInputWrapRef}
                                            className="card-generator-illustration-input-tooltip-wrap"
                                        >
                                            <Input
                                                variant="outlined"
                                                className="card-generator-illustration-input-main"
                                                readOnly
                                                allowClear={!!localIllustrationDisplayText}
                                                onClear={() => clearIllustration()}
                                                value={localIllustrationDisplayText}
                                                placeholder="点击右侧图标选择本地图片"
                                            />
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <Input
                                        variant="outlined"
                                        className="card-generator-illustration-input-main"
                                        allowClear
                                        onClear={() => clearIllustration()}
                                        status={illustrationUrlError ? 'error' : undefined}
                                        value={illustrationUrlDraft}
                                        onChange={(e) => setIllustrationUrlDraft(e.target.value)}
                                        onBlur={() => flushUrlValidate()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                flushUrlValidate()
                                            }
                                        }}
                                        placeholder="粘贴或输入 https:// 图片地址"
                                    />
                                )}
                                {illustrationMode === 'local' ? (
                                    <Tooltip title="选择本地图片">
                                        <Button
                                            className="card-generator-illustration-pick-btn"
                                            variant="outlined"
                                            type="default"
                                            icon={<ImageIcon size={18} />}
                                            onClick={() => void pickIllustrationFile()}
                                        />
                                    </Tooltip>
                                ) : null}
                            </Flexbox>
                        </div>
                        <input
                            ref={illustrationFileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleIllustrationNativeFileChange}
                        />
                    </Flexbox>
                ),
            },
            {
                label: '卡牌类型',
                name: 'cardType',
                children: (
                    <Select
                        variant="outlined"
                        value={formData.cardType}
                        onChange={(value) => handleChange('cardType', value)}
                        options={CARD_TYPES}
                        placeholder="卡牌类型"
                    />
                ),
            },
        ]

        const monsterAttrChildren = [
            {
                label: '属性',
                name: 'attribute',
                children: (
                    <Select
                        variant="outlined"
                        value={formData.attribute || undefined}
                        onChange={(value) => handleChange('attribute', value ?? '')}
                        options={ATTRIBUTES}
                        placeholder="属性"
                        allowClear
                    />
                ),
            },
            ...(!isLink
                ? [
                    {
                        label: levelLabel,
                        name: 'level',
                        children: (
                            <InputNumber
                                variant="outlined"
                                min={1}
                                max={12}
                                value={formData.level ?? undefined}
                                onChange={(value) => handleChange('level', value)}
                                placeholder={levelLabel}
                                allowClear
                            />
                        ),
                    },
                ]
                : []),
            {
                label: '种族',
                name: 'race',
                children: (
                    <Select
                        variant="outlined"
                        value={formData.race}
                        onChange={(value) => handleChange('race', value)}
                        options={raceOptions}
                        placeholder="种族"
                        allowClear
                    />
                ),
            },
            {
                label: '怪兽类别',
                name: 'monsterCategory',
                children: (
                    <Select
                        variant="outlined"
                        value={formData.monsterCategory || undefined}
                        onChange={(value) => handleChange('monsterCategory', value ?? '')}
                        options={MONSTER_CATEGORIES}
                        placeholder="怪兽类别"
                        allowClear
                    />
                ),
            },
        ]

        const monsterStatsChildren = [
            {
                label: '攻击力',
                name: 'attack',
                children: (
                    <Flexbox horizontal gap={8} className="card-generator-inline-field">
                        <InputNumber
                            variant="outlined"
                            disabled={formData.attackInfinite}
                            min={0}
                            max={9999}
                            value={formData.attackInfinite ? undefined : formData.attack}
                            onChange={(value) => handleChange('attack', value)}
                            placeholder="攻击力"
                            allowClear
                            className="card-generator-inline-field-grow"
                        />
                        <Button
                            variant="outlined"
                            color={formData.attackInfinite ? 'primary' : 'default'}
                            title="切换：数值 / 无限（∞）"
                            onClick={() => handleChange('attackInfinite', !formData.attackInfinite)}
                        >
                            ∞
                        </Button>
                    </Flexbox>
                ),
            },
            {
                label: isLink ? '连接数值' : '防御力',
                name: isLink ? 'linkRating' : 'defense',
                children: isLink ? (
                    <InputNumber
                        variant="outlined"
                        min={1}
                        max={8}
                        value={formData.linkRating}
                        onChange={(value) => handleChange('linkRating', value)}
                        placeholder="LINK 数值"
                    />
                ) : (
                    <Flexbox horizontal gap={8} className="card-generator-inline-field">
                        <InputNumber
                            variant="outlined"
                            disabled={formData.defenseInfinite}
                            min={0}
                            max={9999}
                            value={formData.defenseInfinite ? undefined : formData.defense}
                            onChange={(value) => handleChange('defense', value)}
                            placeholder="防御力"
                            allowClear
                            className="card-generator-inline-field-grow"
                        />
                        <Button
                            variant="outlined"
                            color={formData.defenseInfinite ? 'primary' : 'default'}
                            title="切换：数值 / 无限（∞）"
                            onClick={() => handleChange('defenseInfinite', !formData.defenseInfinite)}
                        >
                            ∞
                        </Button>
                    </Flexbox>
                ),
            },
        ]

        const spellChildren = [
            {
                label: '魔法种类',
                name: 'spellType',
                children: (
                    <Select
                        variant="outlined"
                        value={formData.spellType}
                        onChange={(value) => handleChange('spellType', value)}
                        options={SPELL_CARD_TYPES}
                        placeholder="魔法种类"
                    />
                ),
            },
        ]

        const trapChildren = [
            {
                label: '陷阱种类',
                name: 'trapType',
                children: (
                    <Select
                        variant="outlined"
                        value={formData.trapType}
                        onChange={(value) => handleChange('trapType', value)}
                        options={TRAP_CARD_TYPES}
                        placeholder="陷阱种类"
                    />
                ),
            },
        ]

        return [
            {
                key: 'basic',
                icon: IdCard,
                title: '基本信息',
                children: noItemDividers(basicChildren),
            },
            ...(isMonster
                ? [
                    {
                        key: 'monster',
                        icon: Shield,
                        title: '怪兽属性',
                        children: noItemDividers(monsterAttrChildren),
                    },
                    {
                        key: 'stats',
                        icon: GaugeCircle,
                        title: '数值',
                        children: noItemDividers(monsterStatsChildren),
                    },
                ]
                : []),
            ...(isSpell
                ? [
                    {
                        key: 'spell',
                        icon: Sparkles,
                        title: '魔法卡',
                        children: noItemDividers(spellChildren),
                    },
                ]
                : []),
            ...(isTrap
                ? [
                    {
                        key: 'trap',
                        icon: AlertTriangle,
                        title: '陷阱卡',
                        children: noItemDividers(trapChildren),
                    },
                ]
                : []),
            {
                key: 'effect',
                icon: FileText,
                title: isMonster ? '效果文本' : '文本',
                children: noItemDividers([
                    {
                        name: 'effect',
                        label: null,
                        minWidth: '',
                        className: 'card-generator-effect-item',
                        divider: false,
                        children: (
                            <TextArea
                                variant="outlined"
                                maxLength={4500}
                                value={formData.effect}
                                onChange={(e) => handleChange('effect', e.target.value)}
                                placeholder={effectPlaceholder || '输入卡牌效果（可为空）'}
                                style={{ minHeight: 160 }}
                            />
                        ),
                    },
                ]),
            },
        ]
    }, [
        formData,
        illustrationUrlDraft,
        isMonster,
        isSpell,
        isTrap,
        isLink,
        isPendulum,
        levelLabel,
        effectPlaceholder,
        raceOptions,
        handleChange,
        handlePasswordInput,
        localIllustrationDisplayText,
        localPathTruncated,
        localPathTooltipTitle,
        illustrationMode,
        illustrationUrlError,
        handleIllustrationModeChange,
        flushUrlValidate,
        pickIllustrationFile,
        handleIllustrationNativeFileChange,
        clearIllustration,
        setIllustrationUrlDraft,
    ])

    return (
        <Flexbox
            vertical
            className="card-generator ygo-page-shell ygo-page-shell--full"
            style={{
                flex: 1,
                minHeight: 0,
                height: '100%',
                overflow: 'hidden',
                padding: '0 var(--spacing-md)',
                boxSizing: 'border-box',
            }}
        >
            {/* 标题固定；主内容区内仅左侧参数区滚动 */}
            <PageHeader title="卡牌生成器" icon={Home} iconSize={22} />

            <Flexbox
                horizontal
                align="stretch"
                gap={12}
                className="card-generator-body"
                style={{ flex: 1, minHeight: 0 }}
            >
                <Flexbox vertical gap={8} className="card-generator-left" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                    <Flexbox horizontal gap={8} wrap="wrap" className="card-generator-toolbar" style={{ flexShrink: 0 }}>
                        <Button type="primary" variant="filled" icon={<Save size={16} />} onClick={handleSave}>
                            保存
                        </Button>
                        <Button variant="outlined" icon={<RotateCcw size={16} />} onClick={handleReset}>
                            重置
                        </Button>
                    </Flexbox>

                    <ScrollArea
                        flex={1}
                        className="card-generator-scroll"
                        contentProps={{ className: 'card-generator-scroll-content' }}
                        style={{ minWidth: 0, minHeight: 0, height: '100%' }}
                    >
                        <Form
                            className="card-generator-form"
                            items={items}
                            variant="outlined"
                            layout="horizontal"
                            labelAlign="left"
                            itemMinWidth="max(30%, 240px)"
                            style={{ width: '100%' }}
                        />
                    </ScrollArea>
                </Flexbox>

                <Flexbox vertical align="center" className="card-generator-preview-aside" style={{ flexShrink: 0, minHeight: 0 }}>
                    <CardPreviewPanel
                        previewCard={previewCard}
                        previewVisible={previewVisible}
                        autoRefresh={autoRefresh}
                        setPreviewVisible={setPreviewVisible}
                        onToggleAutoRefresh={handleToggleAutoRefresh}
                    />
                </Flexbox>
            </Flexbox>
        </Flexbox>
    )
}
