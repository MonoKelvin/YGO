import { useEffect, useState, useCallback, useMemo } from 'react'
import {
    Button,
    Flexbox,
    Form,
    Input,
    InputNumber,
    ScrollArea,
    TextArea,
    Tooltip,
} from '@lobehub/ui'
import { Select } from '@lobehub/ui/base-ui'
import {
    AlertTriangle,
    FileText,
    GaugeCircle,
    Home,
    IdCard,
    RotateCcw,
    Save,
    Shield,
    Sparkles,
    Upload,
} from 'lucide-react'
import CardPreviewPanel from './CardPreviewPanel'
import useCardStore from '../../store/useStore'
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

    const formData = cardGenerator.formData
    const previewVisible = cardGenerator.previewVisible
    const autoRefresh = cardGenerator.autoRefresh
    const [refreshKey, setRefreshKey] = useState(0)

    const setFormData = useCallback((data) => setCardGeneratorState({ formData: data }), [setCardGeneratorState])
    const setPreviewVisible = useCallback((value) => setCardGeneratorState({ previewVisible: value }), [setCardGeneratorState])
    const setAutoRefresh = useCallback((value) => setCardGeneratorState({ autoRefresh: value }), [setCardGeneratorState])

    useEffect(() => {
        if (autoRefresh) {
            setFormData(normalizeCard(currentCard))
        }
    }, [currentCard, autoRefresh, setFormData])

    useEffect(() => {
        if (!autoRefresh) {
            setFormData(normalizeCard(currentCard))
        }
    }, [refreshKey, currentCard, autoRefresh, setFormData])

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
            return
        }

        const defaultFileName = formData.name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'card'
        const filePath = await window.electronAPI?.saveFileDialog?.({
            title: '保存卡牌图片',
            defaultPath: `${defaultFileName}.png`,
            filters: [{ name: 'PNG 图片', extensions: ['png'] }],
        })

        if (!filePath) return

        const canvas = document.querySelector('.card-preview-canvas')
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png')
            const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
            await window.electronAPI?.writeFile?.(filePath, Buffer.from(base64, 'base64'))
        }

        addCard({ ...formData, imagePath: filePath })
        resetCurrentCard()
        setFormData(normalizeCard({ ...DEFAULT_CARD }))
    }, [formData, addCard, resetCurrentCard, setFormData])

    const handleReset = useCallback(() => {
        resetCurrentCard()
        setFormData(normalizeCard({ ...DEFAULT_CARD }))
    }, [resetCurrentCard, setFormData])

    const handleImageUpload = useCallback(
        (e) => {
            const file = e.target.files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                    const next = normalizeCard({
                        ...formData,
                        imagePath: event.target?.result,
                    })
                    setFormData(next)
                    setCurrentCard(next)
                }
                reader.readAsDataURL(file)
            }
        },
        [formData, setCurrentCard, setFormData],
    )

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
                        value={formData.attribute}
                        onChange={(value) => handleChange('attribute', value)}
                        options={ATTRIBUTES}
                        placeholder="属性"
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
                                value={formData.level}
                                onChange={(value) => handleChange('level', value)}
                                placeholder={levelLabel}
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
                        value={formData.monsterCategory}
                        onChange={(value) => handleChange('monsterCategory', value)}
                        options={MONSTER_CATEGORIES}
                        placeholder="怪兽类别"
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
    ])

    return (
        <Flexbox
            vertical
            className="card-generator"
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
            <Flexbox vertical gap={8} style={{ flexShrink: 0, paddingBottom: 12 }}>
                <h1 className="page-title" style={{ margin: 0 }}>
                    <Home size={26} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    卡牌生成器
                </h1>
            </Flexbox>

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
                        <Button
                            variant="outlined"
                            icon={<Upload size={16} />}
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            上传插图
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
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
                        formData={formData}
                        previewVisible={previewVisible}
                        autoRefresh={autoRefresh}
                        setPreviewVisible={setPreviewVisible}
                        setAutoRefresh={setAutoRefresh}
                        refreshCard={() => {
                            setAutoRefresh(true)
                            setCurrentCard(currentCard)
                            setFormData(normalizeCard(currentCard))
                        }}
                    />
                </Flexbox>
            </Flexbox>
        </Flexbox>
    )
}
