import { useEffect, useState, useCallback } from 'react'
import { Button, Flexbox, Form, Input, InputNumber, TextArea } from '@lobehub/ui'
import { Select } from '@lobehub/ui/base-ui'
import { Home, Save, RotateCcw, Upload } from 'lucide-react'
import CardPreview from '../../components/card-preview'
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
import './CardGenerator.css'

export default function CardGenerator() {
  const currentCard = useCardStore((s) => s.currentCard)
  const setCurrentCard = useCardStore((s) => s.setCurrentCard)
  const addCard = useCardStore((s) => s.addCard)
  const resetCurrentCard = useCardStore((s) => s.resetCurrentCard)

  const [formData, setFormData] = useState(() => normalizeCard(currentCard))

  useEffect(() => {
    setFormData(normalizeCard(currentCard))
  }, [currentCard])

  const handleChange = useCallback((field, value) => {
    const newData = normalizeCard({ ...formData, [field]: value })
    setFormData(newData)
    setCurrentCard(newData)
  }, [formData, setCurrentCard])

  const handleSave = useCallback(() => {
    if (!formData.name.trim()) {
      return
    }
    addCard(formData)
    resetCurrentCard()
    setFormData(normalizeCard({ ...DEFAULT_CARD }))
  }, [formData, addCard, resetCurrentCard])

  const handleReset = useCallback(() => {
    resetCurrentCard()
    setFormData(normalizeCard({ ...DEFAULT_CARD }))
  }, [resetCurrentCard])

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        handleChange('imagePath', event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }, [handleChange])

  const raceOptions = RACES.map((r) => ({ value: r, label: r }))

  const items = [
    {
      key: 'basic',
      title: '基本信息',
      children: [
        {
          label: '卡牌名称',
          name: 'name',
          children: (
            <Input
              variant="outlined"
              value={formData.name}
              maxLength={120}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="卡牌名称"
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
      ],
    },
    {
      key: 'monster',
      title: '怪兽属性',
      hidden: formData.cardType !== 'monster',
      children: [
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
        {
          label: formData.monsterCategory === 'xyz' ? '阶级' : '等级',
          name: 'level',
          children: (
            <InputNumber
              variant="outlined"
              min={1}
              max={12}
              value={formData.level}
              onChange={(value) => handleChange('level', value)}
              placeholder={formData.monsterCategory === 'xyz' ? '阶级' : '等级'}
            />
          ),
        },
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
      ],
    },
    {
      key: 'stats',
      title: '数值',
      hidden: formData.cardType !== 'monster',
      children: [
        {
          label: '攻击力',
          name: 'attack',
          children: (
            <Flexbox horizontal gap={4}>
              <InputNumber
                variant="outlined"
                disabled={formData.attackInfinite}
                min={0}
                max={9999}
                value={formData.attackInfinite ? undefined : formData.attack}
                onChange={(value) => handleChange('attack', value)}
                placeholder="攻击力"
                style={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                type={formData.attackInfinite ? 'primary' : 'default'}
                title="切换：数值 / 无限（∞）"
                onClick={() => handleChange('attackInfinite', !formData.attackInfinite)}
              >
                ∞
              </Button>
            </Flexbox>
          ),
        },
        {
          label: formData.monsterCategory === 'link' ? '连接数值' : '防御力',
          name: formData.monsterCategory === 'link' ? 'linkRating' : 'defense',
          children: formData.monsterCategory === 'link' ? (
            <InputNumber
              variant="outlined"
              min={1}
              max={8}
              value={formData.linkRating}
              onChange={(value) => handleChange('linkRating', value)}
              placeholder="连接数值"
            />
          ) : (
            <Flexbox horizontal gap={4}>
              <InputNumber
                variant="outlined"
                disabled={formData.defenseInfinite}
                min={0}
                max={9999}
                value={formData.defenseInfinite ? undefined : formData.defense}
                onChange={(value) => handleChange('defense', value)}
                placeholder="防御力"
                style={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                type={formData.defenseInfinite ? 'primary' : 'default'}
                title="切换：数值 / 无限（∞）"
                onClick={() => handleChange('defenseInfinite', !formData.defenseInfinite)}
              >
                ∞
              </Button>
            </Flexbox>
          ),
        },
      ],
    },
    {
      key: 'spell',
      title: '魔法类型',
      hidden: formData.cardType !== 'spell',
      children: [
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
      ],
    },
    {
      key: 'trap',
      title: '陷阱类型',
      hidden: formData.cardType !== 'trap',
      children: [
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
      ],
    },
    {
      key: 'effect',
      title: '效果文本',
      children: [
        {
          label: '卡牌效果',
          name: 'effect',
          desc: formData.monsterCategory === 'pendulum'
            ? '怪兽效果与灵摆效果可用连续空行分段（上：怪兽文本 / 下：灵摆文本）'
            : '',
          children: (
            <TextArea
              variant="outlined"
              maxLength={4500}
              value={formData.effect}
              onChange={(e) => handleChange('effect', e.target.value)}
              placeholder={
                formData.monsterCategory === 'pendulum'
                  ? '怪兽效果与灵摆效果可用连续空行分段（上：怪兽文本 / 下：灵摆文本）'
                  : '输入卡牌效果（可为空）'
              }
              style={{ minHeight: 120 }}
            />
          ),
        },
      ],
    },
  ]

  return (
    <div className="card-generator">
      <div className="card-generator-main">
        <div className="page-header">
          <h1 className="page-title">
            <Home size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            卡牌生成器
          </h1>
        </div>

        <Flexbox horizontal gap={12} style={{ marginBottom: 16 }}>
          <Button
            variant="outlined"
            type="primary"
            icon={<Save size={16} />}
            onClick={handleSave}
          >
            保存卡牌
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

        <Form
          items={items}
          collapsible
          variant="outlined"
          layout="vertical"
          labelAlign="left"
        />
      </div>

      <div className="card-generator-preview">
        <h2 className="preview-title">卡牌预览</h2>
        <CardPreview card={formData} />
      </div>
    </div>
  )
}
