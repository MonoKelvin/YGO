import { createModal } from '@lobehub/ui'

/**
 * 使用 Lobe 栈式 Modal（需树根处挂载 `<ModalHost />`）。
 * @param {object} config
 * @param {import('react').ReactNode} config.title
 * @param {import('react').ReactNode} config.content
 * @param {string} [config.okText]
 * @param {string} [config.cancelText]
 * @param {object} [config.okButtonProps]
 * @param {number} [config.width]
 * @param {() => void | Promise<void>} [config.onOk]
 * @param {() => void} [config.onCancel]
 */
export function openConfirmModal(config) {
  const {
    title,
    content,
    okText = '确定',
    cancelText = '取消',
    okButtonProps,
    width,
    onOk,
    onCancel,
  } = config

  return createModal({
    title,
    width,
    children: content,
    okText,
    cancelText,
    okButtonProps,
    onOk: async () => {
      await onOk?.()
    },
    onCancel: () => {
      onCancel?.()
    },
  })
}
