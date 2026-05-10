import { ThemeProvider } from '@lobehub/ui'
import { Routes, Route } from 'react-router-dom'
import CardGenerator from './pages/CardGenerator'
import CardBrowser from './pages/CardBrowser'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import useCardStore from './store/useStore'
import { useEffect, useState } from 'react'

function AppContent() {
  const { settings } = useCardStore()
  const [theme, setTheme] = useState({ appearance: 'light' })
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initTheme = async () => {
      if (window.electronAPI) {
        try {
          const storedSettings = await window.electronAPI.readUserSettings()
          const stored = storedSettings.data || {}
          const themeSetting = stored.theme || 'system'
          
          if (themeSetting === 'system') {
            const systemTheme = await window.electronAPI.getSystemTheme()
            setTheme({ appearance: systemTheme })
          } else {
            setTheme({ appearance: themeSetting })
          }

          window.electronAPI.onSystemThemeChanged((newTheme) => {
            const currentTheme = useCardStore.getState().settings.theme
            if (currentTheme === 'system') {
              setTheme({ appearance: newTheme })
            }
          })
        } catch (error) {
          console.error('Failed to initialize theme:', error)
        }
      }
      setInitialized(true)
    }

    initTheme()
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return

    const unsubscribe = useCardStore.subscribe((state) => {
      const themeSetting = state.settings.theme || 'system'
      if (themeSetting === 'system') {
        window.electronAPI.getSystemTheme().then((systemTheme) => {
          setTheme({ appearance: systemTheme })
        })
      } else {
        setTheme({ appearance: themeSetting })
      }
    })

    return () => unsubscribe()
  }, [initialized])

  if (!initialized) {
    return null
  }

  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Routes>
          <Route path="/" element={<CardGenerator />} />
          <Route path="/browse" element={<CardBrowser />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  )
}

function App() {
  return <AppContent />
}

export default App
