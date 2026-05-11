import { createLobeAntdTheme } from '@lobehub/ui/es/styles/theme/antdTheme'

/**
 * 供 ThemeProvider.theme：基于 Lobe 官方 createLobeAntdTheme（antd-style token），
 * 仅保留侧栏 Menu / Layout 与内容区背景的少量对齐；其余交由组件库默认 token。
 */
export function buildLobeTheme(resolvedAppearance) {
  const dark = resolvedAppearance === 'dark'

  const lobe = createLobeAntdTheme({
    appearance: resolvedAppearance,
    primaryColor: 'blue',
    neutralColor: 'gray',
  })

  const token = lobe.token || {}

  return {
    ...lobe,
    components: {
      ...lobe.components,
      Menu: {
        ...lobe.components?.Menu,
        itemBg: 'transparent',
        itemSelectedBg: dark
          ? 'rgba(106, 205, 228, 0.14)'
          : 'rgba(21, 154, 176, 0.12)',
        itemHoverBg: dark
          ? 'rgba(106, 205, 228, 0.1)'
          : 'rgba(21, 154, 176, 0.08)',
        itemSelectedColor: token.colorPrimary,
        itemColor: token.colorText,
        itemHoverColor: token.colorText,
        subMenuItemBg: 'transparent',
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(106, 205, 228, 0.16)',
        darkItemHoverBg: 'rgba(106, 205, 228, 0.1)',
      },
      Layout: {
        ...lobe.components?.Layout,
        bodyBg: token.colorBgLayout,
        headerBg: token.colorBgContainer,
        siderBg: token.colorBgContainer,
        triggerBg: token.colorBgElevated,
      },
    },
  }
}
