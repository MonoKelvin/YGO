/**
 * 为 NSIS 辅助安装向导生成品牌位图（24-bit BMP），供 electron-builder 使用。
 * 视觉：极简扁平（窄色条 + 纯色侧栏无分区、顶栏细底线 + 短品牌线，无渐变）。
 *
 * 尺寸约定（NSIS Modern UI 2 / electron-builder）：
 * - installerSidebar / uninstallerSidebar：164 × 314
 * - installerHeader：150 × 57
 *
 * 输出到 build/（.gitignore，与 icon 生成策略一致）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = join(root, 'build')
const appIconPath = join(root, 'src/assets/app/logo-256x256.png')

const SIDEBAR_W = 164
const SIDEBAR_H = 314
const HEADER_W = 150
const HEADER_H = 57

/** 品牌色（与 installer.nsh / 应用浅灰底风格一致） */
const ACCENT = '6E78FF'
const PANEL = '141418'
/** 侧栏底部说明文字（略灰，与面板同底更扁平） */
const CAPTION = '8B8E9A'

/**
 * 写入 24 位 BMP（BI_RGB，自下而上扫描）。sharp 无 BMP 编码器时用手写头。
 * @param {Buffer} rgbTopDown 每像素 RGB，width*height*3，首行为图像顶部。
 */
function writeBmp24File(dest, rgbTopDown, width, height) {
  const rowStride = Math.floor((width * 3 + 3) / 4) * 4
  const pixelBytes = rowStride * height
  const fileSize = 14 + 40 + pixelBytes
  const buf = Buffer.alloc(fileSize)

  buf.write('BM', 0)
  buf.writeUInt32LE(fileSize, 2)
  buf.writeUInt32LE(0, 6)
  buf.writeUInt32LE(54, 10)

  const bi = 14
  buf.writeUInt32LE(40, bi + 0)
  buf.writeInt32LE(width, bi + 4)
  buf.writeInt32LE(height, bi + 8)
  buf.writeUInt16LE(1, bi + 12)
  buf.writeUInt16LE(24, bi + 14)
  buf.writeUInt32LE(0, bi + 16)
  buf.writeUInt32LE(pixelBytes, bi + 20)
  buf.writeUInt32LE(0, bi + 24)
  buf.writeUInt32LE(0, bi + 28)
  buf.writeUInt32LE(0, bi + 32)
  buf.writeUInt32LE(0, bi + 36)

  let off = 54
  for (let y = height - 1; y >= 0; y--) {
    const srcRow = y * width * 3
    for (let x = 0; x < width; x++) {
      const src = srcRow + x * 3
      buf[off++] = rgbTopDown[src + 2]
      buf[off++] = rgbTopDown[src + 1]
      buf[off++] = rgbTopDown[src]
    }
    const pad = rowStride - width * 3
    for (let p = 0; p < pad; p++) buf[off++] = 0
  }

  writeFileSync(dest, buf)
}

function stripRgbIfRgba(data, w, h, channels) {
  if (channels === 3) return data
  if (channels === 4) {
    const rgb = Buffer.alloc(w * h * 3)
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgb[j] = data[i]
      rgb[j + 1] = data[i + 1]
      rgb[j + 2] = data[i + 2]
    }
    return rgb
  }
  throw new Error(`[nsis-ui] 通道数异常: ${channels}`)
}

/**
 * 侧栏：窄色条 + 整面纯色（无底栏分区/分割线），极简扁平。
 * @param {{ accent: string, uninstall?: boolean }} opts
 */
async function renderSidebar(opts) {
  const accent = opts.accent ?? ACCENT
  const barW = 4
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIDEBAR_W}" height="${SIDEBAR_H}">
  <rect width="${barW}" height="${SIDEBAR_H}" fill="#${accent}"/>
  <rect x="${barW}" y="0" width="${SIDEBAR_W - barW}" height="${SIDEBAR_H}" fill="#${PANEL}"/>
  <text x="${barW + (SIDEBAR_W - barW) / 2}" y="${SIDEBAR_H - 16}" text-anchor="middle"
    fill="#${CAPTION}" font-family="Segoe UI, Microsoft YaHei UI, sans-serif" font-size="9.5" font-weight="500" letter-spacing="0.12em">
    ${opts.uninstall ? '卸载' : '安装向导'}
  </text>
</svg>`

  const bg = { r: 20, g: 21, b: 24 }
  let base = sharp(Buffer.from(svg)).ensureAlpha().flatten({ background: bg })

  if (existsSync(appIconPath)) {
    const logo = await sharp(readFileSync(appIconPath))
      .resize(72, 72, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    const top = 40
    const left = barW + Math.round((SIDEBAR_W - barW - 72) / 2)
    base = base.composite([{ input: logo, left, top, blend: 'over' }])
  }

  const { data, info } = await base.flatten({ background: bg }).raw().toBuffer({ resolveWithObject: true })
  return {
    buffer: stripRgbIfRgba(data, info.width, info.height, info.channels),
    width: info.width,
    height: info.height,
  }
}

/**
 * 顶栏：与 MUI 背景一致的纯色 + 1px 中性底线 + 标题下短品牌线（非通栏色条，更扁平）。
 */
async function renderHeader(accent) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${HEADER_W}" height="${HEADER_H}">
  <rect width="${HEADER_W}" height="${HEADER_H}" fill="#f2f4f8"/>
  <rect x="0" y="${HEADER_H - 1}" width="${HEADER_W}" height="1" fill="#e4e6ed"/>
  <text x="12" y="22" fill="#1a1b22" font-family="Segoe UI, Microsoft YaHei UI, sans-serif" font-size="15" font-weight="600">YGO</text>
  <rect x="12" y="26" width="30" height="2" fill="#${accent}"/>
  <text x="12" y="42" fill="#6b6d78" font-family="Segoe UI, Microsoft YaHei UI, sans-serif" font-size="8">游戏王卡牌工具</text>
</svg>`

  const { data, info } = await sharp(Buffer.from(svg))
    .flatten({ background: { r: 242, g: 244, b: 248 } })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    buffer: stripRgbIfRgba(data, info.width, info.height, info.channels),
    width: info.width,
    height: info.height,
  }
}

export async function ensureNsisInstallerUi() {
  mkdirSync(buildDir, { recursive: true })

  const accent = ACCENT
  const installSide = await renderSidebar({ accent })
  const uninstallSide = await renderSidebar({ accent, uninstall: true })
  const header = await renderHeader(accent)

  const outSidebar = join(buildDir, 'installerSidebar.bmp')
  const outUnSidebar = join(buildDir, 'uninstallerSidebar.bmp')
  const outHeader = join(buildDir, 'installerHeader.bmp')

  writeBmp24File(outSidebar, installSide.buffer, installSide.width, installSide.height)
  writeBmp24File(outUnSidebar, uninstallSide.buffer, uninstallSide.width, uninstallSide.height)
  writeBmp24File(outHeader, header.buffer, header.width, header.height)

  return { outSidebar, outUnSidebar, outHeader }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureNsisInstallerUi()
    .then((o) => {
      console.log('[nsis-ui] 已生成:', o.outSidebar)
      console.log('[nsis-ui] 已生成:', o.outUnSidebar)
      console.log('[nsis-ui] 已生成:', o.outHeader)
    })
    .catch((err) => {
      console.error('[nsis-ui]', err.message || err)
      process.exit(1)
    })
}
