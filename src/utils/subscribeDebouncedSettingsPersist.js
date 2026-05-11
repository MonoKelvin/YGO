import { shallow } from 'zustand/shallow'
import useCardStore from '../store/useStore'
import { persistUserSettingsToDisk } from './persistUserSettings'

/** settings 变更后防抖写入磁盘（Electron）；浏览器环境不写 */
export function subscribeDebouncedSettingsPersist(delayMs = 450) {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  if (!electron?.saveUserSettings) {
    return () => {}
  }

  let timer = null
  let prevSettings = useCardStore.getState().settings

  const unsub = useCardStore.subscribe((state) => {
    if (shallow(prevSettings, state.settings)) return
    prevSettings = state.settings
    clearTimeout(timer)
    timer = setTimeout(() => {
      void persistUserSettingsToDisk()
    }, delayMs)
  })

  return () => {
    clearTimeout(timer)
    unsub()
  }
}
