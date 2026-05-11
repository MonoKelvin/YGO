import { useEffect, useState } from 'react'
import { Button, Input, TextArea } from '@lobehub/ui'
import { Select } from '@lobehub/ui/base-ui'
import { Save, RotateCcw, Upload } from 'lucide-react'
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

function clampInt(value, min, max, fallback = min) {
  const n = Number.parseInt(String(value), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export default function CardGenerator() {
  const currentCard = useCardStore((s) => s.currentCard)
  const setCurrentCard = useCardStore((s) => s.setCurrentCard)
  const addCard = useCardStore((s) => s.addCard)
  const resetCurrentCard = useCardStore((s) => s.resetCurrentCard)

  const [formData, setFormData] = useState(() => normalizeCard(currentCard))

  useEffect(() => {
    setFormData(normalizeCard(currentCard))
  }, [currentCard])

  const handleChange = (field, value) => {
    const newData = normalizeCard({ ...formData, [field]: value })
    setFormData(newData)
    setCurrentCard(newData)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      return
    }
    addCard(formData)
    resetCurrentCard()
    setFormData(normalizeCard({ ...DEFAULT_CARD }))
  }

  const handleReset = () => {
    resetCurrentCard()
    setFormData(normalizeCard({ ...DEFAULT_CARD }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        handleChange('imagePath', event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const raceOptions = RACES.map((r) => ({ value: r, label: r }))

  return (
    <div className="card-generator">
      <div className="card-generator-main">
        <h1 className="page-title">卡牌生成器</h1>

        <div className="form-grid">
          <div className="form-item">
            <label className="form-label">卡牌名称</label>
            <Input
              value={formData.name}
              maxLength={120}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="输入卡牌名称"
            />
          </div>

          <div className="form-item">
            <label className="form-label">密码</label>
            <Input
              value={formData.password}
              inputMode="numeric"
              maxLength={8}
              onChange={(e) =>
                handleChange(
                  'password',
                  String(e.target.value).replace(/\D/g, '').slice(0, 8),
                )
              }
              placeholder="8位数字密码"
            />
          </div>

          <div className="form-item">
            <label className="form-label">卡牌类型</label>
            <Select
              value={formData.cardType}
              onChange={(value) => handleChange('cardType', value)}
              options={CARD_TYPES}
              style={{ width: '100%' }}
            />
          </div>

          {formData.cardType === 'monster' && (
            <>
              <div className="form-item">
                <label className="form-label">属性</label>
                <Select
                  value={formData.attribute}
                  onChange={(value) => handleChange('attribute', value)}
                  options={ATTRIBUTES}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-item">
                <label className="form-label">
                  {formData.monsterCategory === 'xyz' ? '阶级（★）' : '等级（★）'}
                </label>
                <Input
                  inputMode="numeric"
                  min={1}
                  max={12}
                  value={formData.level}
                  onChange={(e) =>
                    handleChange(
                      'level',
                      clampInt(e.target.value, 1, 12, formData.level),
                    )
                  }
                />
              </div>

              <div className="form-item">
                <label className="form-label">种族</label>
                <Select
                  value={formData.race}
                  onChange={(value) => handleChange('race', value)}
                  options={raceOptions}
                  placeholder="选择种族"
                  style={{ width: '100%' }}
                  allowClear
                />
              </div>

              <div className="form-item">
                <label className="form-label">怪兽类别</label>
                <Select
                  value={formData.monsterCategory}
                  onChange={(value) => handleChange('monsterCategory', value)}
                  options={MONSTER_CATEGORIES}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-item">
                <label className="form-label">攻击力</label>
                <div className="form-stat-row">
                  <Input
                    className="form-stat-input"
                    type={formData.attackInfinite ? 'text' : 'number'}
                    readOnly={formData.attackInfinite}
                    min={0}
                    max={9999}
                    value={formData.attackInfinite ? '\u221e' : formData.attack}
                    onChange={(e) =>
                      handleChange(
                        'attack',
                        clampInt(e.target.value, 0, 9999, formData.attack),
                      )
                    }
                  />
                  <Button
                    type={formData.attackInfinite ? 'primary' : 'default'}
                    className="form-infinity-btn"
                    title="切换：数值 / 无限（∞）"
                    aria-label="攻击力无限大"
                    onClick={() =>
                      handleChange('attackInfinite', !formData.attackInfinite)
                    }
                  >
                    ∞
                  </Button>
                </div>
              </div>

              {formData.monsterCategory === 'link' ? (
                <div className="form-item">
                  <label className="form-label">连接数值</label>
                  <Input
                    inputMode="numeric"
                    min={1}
                    max={8}
                    value={formData.linkRating}
                    onChange={(e) =>
                      handleChange(
                        'linkRating',
                        clampInt(e.target.value, 1, 8, formData.linkRating),
                      )
                    }
                  />
                </div>
              ) : (
                <div className="form-item">
                  <label className="form-label">防御力</label>
                  <div className="form-stat-row">
                    <Input
                      className="form-stat-input"
                      inputMode={
                        formData.defenseInfinite ? 'text' : 'numeric'
                      }
                      readOnly={formData.defenseInfinite}
                      min={0}
                      max={9999}
                      value={formData.defenseInfinite ? '\u221e' : formData.defense}
                      onChange={(e) =>
                        handleChange(
                          'defense',
                          clampInt(
                            e.target.value,
                            0,
                            9999,
                            formData.defense,
                          ),
                        )
                      }
                    />
                    <Button
                      type={formData.defenseInfinite ? 'primary' : 'default'}
                      className="form-infinity-btn"
                      title="切换：数值 / 无限（∞）"
                      aria-label="防御力无限大"
                      onClick={() =>
                        handleChange(
                          'defenseInfinite',
                          !formData.defenseInfinite,
                        )
                      }
                    >
                      ∞
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {formData.cardType === 'spell' && (
            <div className="form-item">
              <label className="form-label">魔法种类</label>
              <Select
                value={formData.spellType}
                onChange={(value) => handleChange('spellType', value)}
                options={SPELL_CARD_TYPES}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {formData.cardType === 'trap' && (
            <div className="form-item">
              <label className="form-label">陷阱种类</label>
              <Select
                value={formData.trapType}
                onChange={(value) => handleChange('trapType', value)}
                options={TRAP_CARD_TYPES}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div className="form-item form-item-full">
            <label className="form-label">效果文本</label>
            <TextArea
              maxLength={4500}
              value={formData.effect}
              onChange={(e) => handleChange('effect', e.target.value)}
              placeholder={
                formData.monsterCategory === 'pendulum'
                  ? '怪兽效果与灵摆效果可用连续空行分段（上：怪兽文本 / 下：灵摆文本）'
                  : '输入卡牌效果（可为空）'
              }
              style={{ minHeight: 'var(--control-textarea-min-height)' }}
            />
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="primary"
            icon={<Save size={16} />}
            onClick={handleSave}
          >
            保存卡牌
          </Button>
          <Button icon={<RotateCcw size={16} />} onClick={handleReset}>
            重置
          </Button>
          <label className="upload-label">
            <Upload size={16} />
            上传插图
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="card-generator-preview">
        <h2 className="section-title">卡牌预览</h2>
        <CardPreview card={formData} />
      </div>
    </div>
  )
}
