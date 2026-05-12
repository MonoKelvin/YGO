import { Flexbox, Modal } from '@lobehub/ui'

export default function CardLibraryAddToDeckModal({
  open,
  addModalCards,
  decksForPicker,
  pickDeckId,
  setPickDeckId,
  onOk,
  onCancel,
}) {
  return (
    <Modal
      title={
        addModalCards.length > 1
          ? `加入卡组（${addModalCards.length} 张）`
          : '加入卡组'
      }
      open={open}
      okText="加入"
      cancelText="取消"
      onOk={onOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      {!decksForPicker.length ? (
        <p>暂无卡组，请先到「我的卡组」新建。</p>
      ) : (
        <Flexbox vertical gap={8}>
          {decksForPicker.map((d) => (
            <label
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="card-library-pick-deck"
                checked={pickDeckId === d.id}
                onChange={() => setPickDeckId(d.id)}
              />
              <span>
                {d.name}
                {d.pinned ? ' · 置顶' : ''}
              </span>
            </label>
          ))}
        </Flexbox>
      )}
    </Modal>
  )
}
