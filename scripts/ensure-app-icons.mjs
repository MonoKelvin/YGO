/**
 * 从 src/assets/app 生成 electron-builder 所需的 build/icon.png 与 build/icon.ico
 * 源图若非正方形，会先等比缩放并居中铺到方形画布（透明底）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appIconDir = join(root, 'src/assets/app')
const buildDir = join(root, 'build')

const ICO_SIZES = [16, 32, 48, 64, 128, 256]

/**
 * @param {Buffer} input
 * @param {number} size
 */
async function toSquarePng(input, size) {
  return sharp(input)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

/**
 * @returns {{ pngDest: string, icoDest: string }}
 */
export async function ensureAppIcons() {
  const master = join(appIconDir, 'logo-256x256.png')
  if (!existsSync(master)) {
    throw new Error(
      `缺少应用图标：${master}\n请将 logo-16x16.png … logo-256x256.png 放入 src/assets/app/`,
    )
  }

  mkdirSync(buildDir, { recursive: true })
  const masterBuf = readFileSync(master)

  const pngDest = join(buildDir, 'icon.png')
  const square256 = await toSquarePng(masterBuf, 256)
  writeFileSync(pngDest, square256)

  const icoBuffers = await Promise.all(
    ICO_SIZES.map((size) => toSquarePng(masterBuf, size)),
  )
  const icoDest = join(buildDir, 'icon.ico')
  writeFileSync(icoDest, await pngToIco(icoBuffers))

  const { ensureNsisInstallerUi } = await import('./prepare-nsis-installer-ui.mjs')
  await ensureNsisInstallerUi()

  return { pngDest, icoDest }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureAppIcons()
    .then(({ pngDest, icoDest }) => {
      console.log('[icons] 已生成:', pngDest)
      console.log('[icons] 已生成:', icoDest)
    })
    .catch((err) => {
      console.error('[icons]', err.message || err)
      process.exit(1)
    })
}
