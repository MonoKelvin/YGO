/**
 * 卡组信息 Form：查看模式含时间字段，新建模式仅名称/简介/备注。
 */
import { Text, Input, TextArea, Form } from '@lobehub/ui'
import { FileText } from 'lucide-react'
import { DEFAULT_DECK_NAME } from '../../config/deckConstants'
import { DECK_DESC_MAX, DECK_NOTES_MAX, fmtDeckTimestamp } from './deckMetaConstants'
import './DeckMetaForm.css'

export default function DeckMetaForm({
  name,
  onNameChange,
  onNameBlur,
  onNamePressEnter,
  description,
  onDescriptionChange,
  notes,
  onNotesChange,
  showTimestamps = false,
  createdAt,
  updatedAt,
  readOnlyName = false,
  nameDesc,
  namePlaceholder = '卡组名称（不可与其他卡组重复）',
}) {
  const descLen = (description ?? '').length
  const notesLen = (notes ?? '').length

  const items = [
    {
      label: '名称',
      className: 'deck-meta-form-item--name',
      desc: nameDesc,
      children: (
        <Input
          className="deck-meta-name-input"
          variant="outlined"
          value={readOnlyName ? DEFAULT_DECK_NAME : name}
          onChange={(e) => onNameChange?.(e.target.value)}
          onBlur={onNameBlur}
          onPressEnter={onNamePressEnter}
          placeholder={namePlaceholder}
          maxLength={80}
          disabled={readOnlyName}
          readOnly={readOnlyName}
        />
      ),
    },
    {
      label: `简介（${descLen}/${DECK_DESC_MAX}字）`,
      children: (
        <TextArea
          variant="outlined"
          value={description ?? ''}
          onChange={(e) => onDescriptionChange?.(e.target.value)}
          placeholder="一句话介绍这套卡组"
          autoSize={{ minRows: 2, maxRows: 6 }}
          maxLength={DECK_DESC_MAX}
        />
      ),
    },
    {
      label: `备注（${notesLen}/${DECK_NOTES_MAX}字）`,
      children: (
        <TextArea
          variant="outlined"
          value={notes ?? ''}
          onChange={(e) => onNotesChange?.(e.target.value)}
          placeholder="自用备忘、比赛记录等"
          autoSize={{ minRows: 2, maxRows: 8 }}
          maxLength={DECK_NOTES_MAX}
        />
      ),
    },
  ]

  if (showTimestamps) {
    items.push(
      {
        label: '创建时间',
        className: 'deck-meta-form-item--time',
        children: (
          <Text type="secondary" className="deck-meta-time-value">
            {fmtDeckTimestamp(createdAt)}
          </Text>
        ),
      },
      {
        label: '修改时间',
        className: 'deck-meta-form-item--time',
        desc: '保存卡组时自动更新',
        children: (
          <Text type="secondary" className="deck-meta-time-value">
            {fmtDeckTimestamp(updatedAt)}
          </Text>
        ),
      },
    )
  }

  return (
    <Form
      className="deck-meta-form"
      items={[
        {
          key: 'deck-meta',
          icon: FileText,
          title: '卡组信息',
          children: items,
        },
      ]}
      variant="outlined"
      layout="horizontal"
      labelAlign="left"
      collapsible
    />
  )
}
