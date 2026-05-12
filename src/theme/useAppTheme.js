import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import useCardStore from '../store/useStore'
import {
  resolveAppearance,
  getBrowserSystemAppearance,
  applyDataThemeAttribute,
} from './appearance'

/**
 * 单一数据源：以 Zustand settings.theme 为准，同步 html[data-theme]，
 * 并聚合 Electron / matchMedia 的系统明暗变化。
 *
 * - 偏好为 light/dark 时 resolved 不随系统变；系统快照仍会更新。
 * - useLayoutEffect 写入 DOM，减轻切换时闪烁。
 */
export function useAppTheme() {
  const preference = useCardStore((s) => s.settings.theme ?? 'system')

  const electron =
    typeof window !== 'undefined' ? window.electronAPI : undefined

  const [systemAppearance, setSystemAppearance] = useState(() => {
    // 在 Electron 环境下，优先使用同步方式获取系统主题
    if (typeof window !== 'undefined' && window.electronAPI?.getSystemTheme) {
      try {
        // 尝试同步获取，虽然 electron.getSystemTheme() 是异步的，但我们可以使用 matchMedia 作为备选
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const result = mq.matches ? 'dark' : 'light'
        return result
      } catch (err) {
        return getBrowserSystemAppearance()
      }
    }
    return getBrowserSystemAppearance()
  })

  useEffect(() => {
    if (electron?.getSystemTheme) {
      let cancelled = false
      electron
        .getSystemTheme()
        .then((t) => {
          if (!cancelled && t) {
            // 确保获取到的主题值是有效的
            if (t === 'dark' || t === 'light') {
              setSystemAppearance(t)
            }
          }
        })
        .catch(() => {
          // fallback to matchMedia
        })
      return () => {
        cancelled = true
      }
    } else {
      // fallback to matchMedia
    }
  }, [electron])

  useEffect(() => {
    if (electron?.onSystemThemeChanged) {
      const unsub = electron.onSystemThemeChanged((t) => {
        setSystemAppearance(t)
      })
      return typeof unsub === 'function' ? unsub : undefined
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      setSystemAppearance(mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [electron])

  const resolvedAppearance = useMemo(
    () => resolveAppearance(preference, systemAppearance),
    [preference, systemAppearance],
  )

  useLayoutEffect(() => {
    applyDataThemeAttribute(resolvedAppearance)
  }, [resolvedAppearance])

  return { resolvedAppearance, preference, systemAppearance }
}
