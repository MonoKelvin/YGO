const path = require('path')
const fs = require('fs')

const APP_ICON_DIR_DEV = path.join(__dirname, '../../src/assets/app')

/**
 * 解析窗口 / 任务栏图标路径（开发用源码目录，打包后用 extraResources）
 * @returns {string|undefined}
 */
function resolveAppIconPath() {
  const candidates = []

  if (process.resourcesPath) {
    candidates.push(
      path.join(process.resourcesPath, 'assets', 'app', 'logo-256x256.png'),
      path.join(process.resourcesPath, 'assets', 'app', 'logo-128x128.png'),
    )
  }

  const buildIco = path.join(__dirname, '../../build/icon.ico')
  const buildPng = path.join(__dirname, '../../build/icon.png')
  if (process.platform === 'win32' && fs.existsSync(buildIco)) {
    candidates.unshift(buildIco)
  }
  if (fs.existsSync(buildPng)) {
    candidates.unshift(buildPng)
  }

  candidates.push(
    path.join(APP_ICON_DIR_DEV, 'logo-256x256.png'),
    path.join(APP_ICON_DIR_DEV, 'logo-128x128.png'),
  )

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return undefined
}

module.exports = { resolveAppIconPath }
