import { ColorSwatches, ThemeSwitch, primaryColors } from '@lobehub/ui'
import {
  LOBE_PRIMARY_COLOR_KEYS,
  LOBE_PRIMARY_SWATCH_DEFAULT,
  resolveThemePrimaryColor,
} from '../../../config/lobePrimaryColor'

/** Lobe 主色色块：与 ThemeProvider `customTheme.primaryColor` 一致 */
const LOBE_PRIMARY_LABEL_ZH = {
  red: '红色',
  orange: '橙色',
  gold: '金色',
  yellow: '黄色',
  lime: '青柠',
  green: '绿色',
  cyan: '青色',
  blue: '蓝色',
  geekblue: '极客蓝',
  purple: '紫色',
  magenta: '品红',
  volcano: '火山',
}

const primaryColorSwatches = [
  {
    key: 'default',
    title: '默认（内置主色）',
    color: LOBE_PRIMARY_SWATCH_DEFAULT,
  },
  ...LOBE_PRIMARY_COLOR_KEYS.map((key) => ({
    key,
    title: LOBE_PRIMARY_LABEL_ZH[key] || key,
    color: primaryColors[key],
  })),
]

/**
 * 外观设置区块
 * @param {Object} props
 * @param {Object} props.settings - 当前设置
 * @param {string} props.localTheme - 本地主题状态
 * @param {Function} props.onThemeChange - 主题变更回调
 * @param {Function} props.onPrimaryColorChange - 主题色变更回调
 */
export default function AppearanceSection({
  settings,
  localTheme,
  onThemeChange,
  onPrimaryColorChange,
}) {
  const primaryColorSwatchDefault = (() => {
    const key = resolveThemePrimaryColor(settings.primaryColor)
    if (key == null) return LOBE_PRIMARY_SWATCH_DEFAULT
    return primaryColors[key] ?? LOBE_PRIMARY_SWATCH_DEFAULT
  })()

  const primaryColorSwatchesKey =
    settings.primaryColor == null || settings.primaryColor === ''
      ? 'pc-null'
      : `pc-${String(settings.primaryColor)}`

  return [
    {
      label: '主题',
      desc: '选择应用的显示主题',
      name: 'theme',
      children: (
        <ThemeSwitch
          themeMode={localTheme}
          onThemeSwitch={onThemeChange}
          type="select"
          variant="outlined"
          labels={{
            auto: '跟随系统',
            dark: '深色模式',
            light: '浅色模式',
          }}
          style={{ minWidth: 150 }}
        />
      ),
    },
    {
      label: '主题色',
      desc: '首项为默认：不传自定义主色，使用 Lobe 内置主色；其余为预设主色并写入设置',
      name: 'primaryColor',
      children: (
        <ColorSwatches
          key={primaryColorSwatchesKey}
          enableColorPicker={false}
          enableColorSwatches
          size={24}
          shape="circle"
          defaultValue={primaryColorSwatchDefault}
          colors={primaryColorSwatches}
          onChange={onPrimaryColorChange}
        />
      ),
    },
  ]
}
