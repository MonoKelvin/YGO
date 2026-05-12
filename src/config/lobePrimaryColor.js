/**
 * 与 @lobehub/ui ThemeProvider `customTheme.primaryColor` / createLobeAntdTheme 的预设名一致。
 * @see node_modules/@lobehub/ui/es/styles/customTheme.mjs primaryColors
 */
export const LOBE_PRIMARY_COLOR_KEYS = [
  'red',
  'orange',
  'gold',
  'yellow',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
  'magenta',
  'volcano',
]

/** ColorSwatches 首项「默认 / 内置主色」与官方 demo 一致的透明占位 */
export const LOBE_PRIMARY_SWATCH_DEFAULT = 'rgba(0, 0, 0, 0)'

/**
 * 解析持久化的主题主色：返回预设名；null 表示不设置 customTheme.primaryColor，使用 Lobe 内置默认。
 * @param {unknown} value
 * @returns {string | null}
 */
export function resolveThemePrimaryColor(value) {
  if (value == null) return null
  if (value === '') return null
  if (value === 'default') return null
  if (typeof value !== 'string') return null
  const k = value.trim().toLowerCase()
  if (k === 'transparent' || k === 'none') return null
  return LOBE_PRIMARY_COLOR_KEYS.includes(k) ? k : null
}
