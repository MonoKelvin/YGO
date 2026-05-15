import { Switch } from '@lobehub/ui/base-ui'

/**
 * 通用设置区块
 * @param {Object} props
 * @param {Object} props.settings - 当前设置
 * @param {boolean} props.devToolsEnabled - 开发者工具是否开启
 * @param {boolean} props.hasElectron - 是否有 Electron API
 * @param {Function} props.onUseSystemBrowserChange - 使用系统浏览器变更回调
 * @param {Function} props.onTitleBarMetaChange - 顶栏显示变更回调
 * @param {Function} props.onDevToolsToggle - 开发者工具切换回调
 */
export default function GeneralSection({
  settings,
  devToolsEnabled,
  hasElectron,
  onUseSystemBrowserChange,
  onTitleBarMetaChange,
  onDevToolsToggle,
}) {
  const items = [
    {
      label: '使用系统浏览器打开链接',
      desc: '开启后，所有外部链接将使用系统默认浏览器打开；关闭后，将在软件内部窗口打开（无边框）',
      children: (
        <Switch
          variant="outlined"
          checked={settings.useSystemBrowser !== false}
          onChange={onUseSystemBrowserChange}
        />
      ),
    },
    {
      label: '顶栏显示版本与简介',
      desc: '在窗口标题栏显示版本号与简介文案；关闭后仅保留「YGO」名称（开发构建仍显示 dev 标记）',
      children: (
        <Switch
          variant="outlined"
          checked={settings.titleBarShowVersionAndTagline !== false}
          onChange={onTitleBarMetaChange}
        />
      ),
    },
  ]

  // 仅在 Electron 环境下显示开发者工具选项
  if (hasElectron) {
    items.push({
      label: '开发者工具',
      desc: '独立窗口打开；快捷键 Ctrl+Shift+I',
      children: (
        <Switch
          variant="outlined"
          checked={devToolsEnabled}
          onChange={onDevToolsToggle}
        />
      ),
    })
  }

  return items
}
