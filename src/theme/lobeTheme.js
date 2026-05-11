import { createLobeAntdTheme } from '@lobehub/ui/es/styles/theme/antdTheme'

export function buildLobeTheme(resolvedAppearance) {
  return createLobeAntdTheme({
    appearance: resolvedAppearance,
    primaryColor: 'blue',
    neutralColor: 'gray',
  })
}
