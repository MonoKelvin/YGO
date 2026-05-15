/**
 * 在 src/assets/app 下查找方形 logo：`logo-{N}x{N}.png`，取 N 最大者作为母图。
 * 避免只更新了 logo-128x128.png 而 logo-256x256.png 仍是旧图时，打包图标不刷新。
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * @param {string} appIconDir
 * @returns {string | null} 绝对路径，无匹配时 null
 */
export function findBestSquareAppLogoPath(appIconDir) {
  if (!existsSync(appIconDir)) {
    return null
  }
  let bestPath = null
  let bestN = 0
  for (const name of readdirSync(appIconDir)) {
    const m = name.match(/^logo-(\d+)x(\d+)\.png$/i)
    if (!m || m[1] !== m[2]) {
      continue
    }
    const n = parseInt(m[1], 10)
    if (n > bestN) {
      bestN = n
      bestPath = join(appIconDir, name)
    }
  }
  return bestPath
}
