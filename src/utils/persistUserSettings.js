import useCardStore from '../store/useStore'

/** 将当前 Zustand settings 写入 Electron userData/settings.json */
export async function persistUserSettingsToDisk() {
  const electron = typeof window !== 'undefined' ? window.electronAPI : null
  if (!electron?.saveUserSettings) return
  const settings = useCardStore.getState().settings
  await electron.saveUserSettings(settings)
}
