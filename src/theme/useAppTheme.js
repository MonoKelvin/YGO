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

  const [systemAppearance, setSystemAppearance] = useState(() =>
    getBrowserSystemAppearance(),
  )

  useEffect(() => {
    if (!electron?.getSystemTheme) return undefined
    let cancelled = false
    electron.getSystemTheme().then((t) => {
      if (!cancelled) setSystemAppearance(t)
    })
    return () => {
      cancelled = true
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
