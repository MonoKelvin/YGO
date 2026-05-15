import { toast } from '@lobehub/ui'

/**
 * 打开外部链接
 * 根据用户设置决定使用系统浏览器还是软件内部窗口打开
 *
 * @param {string} url - 要打开的链接地址
 * @param {boolean} useSystemBrowser - 是否使用系统浏览器，如果为 null/undefined 则读取用户设置
 * @returns {Promise<{success: boolean, mode?: string, error?: string}>}
 */
export async function openExternalLink(url, useSystemBrowser = null) {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null

  if (!electron?.openExternalLink) {
    console.warn('[openExternalLink] electronAPI 不可用')
    // 降级处理：尝试使用原生打开方式
    window.open(url, '_blank', 'noopener,noreferrer')
    return { success: true, mode: 'fallback' }
  }

  // 如果没有指定，读取用户设置
  let effectiveUseSystemBrowser = useSystemBrowser
  if (effectiveUseSystemBrowser === null || effectiveUseSystemBrowser === undefined) {
    // 从 store 中读取设置，默认使用系统浏览器
    try {
      const { default: useCardStore } = await import('../store/useStore')
      const settings = useCardStore.getState().settings
      effectiveUseSystemBrowser = settings.useSystemBrowser !== false
    } catch (e) {
      console.warn('[openExternalLink] 读取设置失败，使用默认值:', e)
      effectiveUseSystemBrowser = true
    }
  }

  try {
    const result = await electron.openExternalLink(url, effectiveUseSystemBrowser)
    if (!result.success) {
      toast.error({
        title: '打开链接失败',
        description: result.error || '未知错误',
      })
    }
    return result
  } catch (error) {
    const errorMsg = error?.message || String(error)
    toast.error({
      title: '打开链接失败',
      description: errorMsg,
    })
    return { success: false, error: errorMsg }
  }
}

/**
 * 关闭指定 URL 的内部窗口
 * @param {string} url - 要关闭的窗口对应的 URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function closeInternalWindow(url) {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null

  if (!electron?.closeInternalWindow) {
    return { success: false, error: 'electronAPI 不可用' }
  }

  try {
    return await electron.closeInternalWindow(url)
  } catch (error) {
    return { success: false, error: error?.message || String(error) }
  }
}

/**
 * 关闭所有内部窗口
 * @returns {Promise<{success: boolean, closedCount?: number, error?: string}>}
 */
export async function closeAllInternalWindows() {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null

  if (!electron?.closeAllInternalWindows) {
    return { success: false, error: 'electronAPI 不可用' }
  }

  try {
    return await electron.closeAllInternalWindows()
  } catch (error) {
    return { success: false, error: error?.message || String(error) }
  }
}
