import { useState } from 'react'
import { Input } from '@lobehub/ui'
import { Button, Select } from 'antd'
import { Save, RotateCcw, Upload } from 'lucide-react'
import CardRender from '../components/CardRender'
import useCardStore from '../store/useStore'
import { CARD_TYPES, ATTRIBUTES, RACES, DEFAULT_CARD } from '../config/cardConstants'
import './CardGenerator.css'

export default function CardGenerator() {
  const { currentCard, setCurrentCard, addCard, resetCurrentCard } = useCardStore()
  const [formData, setFormData] = useState(currentCard)

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    setCurrentCard(newData)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      return
    }
    addCard(formData)
    resetCurrentCard()
    setFormData(DEFAULT_CARD)
  }

  const handleReset = () => {
    resetCurrentCard()
    setFormData(DEFAULT_CARD)
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

  const raceOptions = RACES.map(r => ({ value: r, label: r }))

  return (
    <div className="card-generator">
      <div className="card-generator-main">
        <h1 className="page-title">卡牌生成器</h1>

        <div className="form-grid">
          <div className="form-item">
            <label className="form-label">卡牌名称</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="输入卡牌名称"
            />
          </div>

          <div className="form-item">
            <label className="form-label">密码</label>
            <Input
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
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
                <label className="form-label">等级</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.level}
                  onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
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
                />
              </div>

              <div className="form-item">
                <label className="form-label">攻击力</label>
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  value={formData.attack}
                  onChange={(e) => handleChange('attack', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-item">
                <label className="form-label">防御力</label>
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  value={formData.defense}
                  onChange={(e) => handleChange('defense', parseInt(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          <div className="form-item form-item-full">
            <label className="form-label">
              {formData.cardType === 'monster' ? '效果文本' : '描述'}
            </label>
            <textarea
              className="textarea"
              value={formData.effect}
              onChange={(e) => handleChange('effect', e.target.value)}
              placeholder="输入卡牌效果或描述"
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
          <Button
            icon={<RotateCcw size={16} />}
            onClick={handleReset}
          >
            重置
          </Button>
          <label className="upload-label">
            <Upload size={16} />
            上传图片
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
        <CardRender card={formData} />
      </div>
    </div>
  )
}
