import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const themeMode = ref('system')
  const systemTheme = ref('light')
  const language = ref('cn')
  const showHoloEffect = ref(true)
  const showPassword = ref(true)
  const showCardbag = ref(false)

  async function loadSettings() {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.readUserSettings()
        if (result.success && result.data) {
          themeMode.value = result.data.themeMode || 'system'
          language.value = result.data.language || 'cn'
          showHoloEffect.value = result.data.showHoloEffect ?? true
          showPassword.value = result.data.showPassword ?? true
          showCardbag.value = result.data.showCardbag ?? false
        }

        systemTheme.value = await window.electronAPI.getSystemTheme()

        window.electronAPI.onSystemThemeChanged((theme) => {
          systemTheme.value = theme
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  async function saveSettings() {
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveUserSettings({
          themeMode: themeMode.value,
          language: language.value,
          showHoloEffect: showHoloEffect.value,
          showPassword: showPassword.value,
          showCardbag: showCardbag.value
        })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  function setThemeMode(mode) {
    themeMode.value = mode
    saveSettings()
  }

  function setLanguage(lang) {
    language.value = lang
    saveSettings()
  }

  function setShowHoloEffect(show) {
    showHoloEffect.value = show
    saveSettings()
  }

  function setShowPassword(show) {
    showPassword.value = show
    saveSettings()
  }

  function setShowCardbag(show) {
    showCardbag.value = show
    saveSettings()
  }

  return {
    themeMode,
    systemTheme,
    language,
    showHoloEffect,
    showPassword,
    showCardbag,
    loadSettings,
    saveSettings,
    setThemeMode,
    setLanguage,
    setShowHoloEffect,
    setShowPassword,
    setShowCardbag
  }
})
