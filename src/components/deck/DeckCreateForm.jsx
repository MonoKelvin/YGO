import { useState } from 'react'
import { Button, Flexbox, toast } from '@lobehub/ui'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import DeckMetaForm from './DeckMetaForm'
import './DeckCreateForm.css'

/**
 * 新建卡组：仅编辑卡组信息，确认后持久化并回调。
 */
export default function DeckCreateForm({ onCancel, onCreated }) {
  const createDeck = useYgoDatabaseStore((s) => s.createDeck)
  const deleteDeck = useYgoDatabaseStore((s) => s.deleteDeck)
  const setDeckNameValidated = useYgoDatabaseStore((s) => s.setDeckNameValidated)
  const updateDeckMeta = useYgoDatabaseStore((s) => s.updateDeckMeta)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.warning('请输入卡组名称')
      return
    }
    setSubmitting(true)
    try {
      const created = createDeck()
      if (!created.ok || !created.deckId) {
        toast.error('创建失败')
        return
      }
      const deckId = created.deckId
      const nameR = setDeckNameValidated(deckId, trimmed)
      if (!nameR.ok) {
        deleteDeck(deckId)
        toast.warning(nameR.reason || '名称无效')
        return
      }
      const desc = description.trim()
      const noteText = notes.trim()
      if (desc || noteText) {
        const metaR = updateDeckMeta(deckId, {
          description: desc,
          notes: noteText,
        })
        if (!metaR.ok) {
          toast.warning(metaR.reason || '简介或备注保存失败')
        }
      }
      toast.success('卡组已创建')
      onCreated?.(deckId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="deck-create-form">
      <DeckMetaForm
        name={name}
        onNameChange={setName}
        onNamePressEnter={handleConfirm}
        description={description}
        onDescriptionChange={setDescription}
        notes={notes}
        onNotesChange={setNotes}
        showTimestamps={false}
        namePlaceholder="输入卡组名称"
      />

      <div className="deck-create-form-footer">
        <Flexbox horizontal gap={12} justify="flex-end" wrap="wrap">
          <Button variant="outlined" disabled={submitting} onClick={onCancel}>
            取消
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleConfirm}
          >
            确认
          </Button>
        </Flexbox>
      </div>
    </div>
  )
}
