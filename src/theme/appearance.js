/**
 * 主题偏好与「实际界面明暗」解析（不含 React）。
 * preference：用户选项；systemAppearance：当前系统/浏览器明暗快照。
 */

/** @typedef {'light' | 'dark'} ResolvedAppearance */
/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

/**
 * @param {ThemePreference | string | undefined} preference
 * @param {ResolvedAppearance} systemAppearance
 * @returns {ResolvedAppearance}
 */
export function resolveAppearance(preference, systemAppearance) {
  if (preference === 'light' || preference === 'dark') return preference
  return systemAppearance
}

/** 浏览器同步读取系统配色（与 Electron nativeTheme 在绝大多数环境下一致） */
export function getBrowserSystemAppearance() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** 将解析结果写入 html[data-theme]，供全局 CSS 变量与样式分支使用 */
export function applyDataThemeAttribute(resolved) {
  document.documentElement.setAttribute('data-theme', resolved)
}
