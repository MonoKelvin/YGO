/**
 * 对比 Mold 目录与 moldExpectedPaths（支持任一候选命中，png/jpg/jpeg/webp）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MOLD_EXPECTED_PATHS } from '../src/config/moldExpectedPaths.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const moldRoot = path.resolve(__dirname, '../src/assets/Mold')

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp']

function fileExistsCaseInsensitive(dirParts, filenameBase) {
  let dir = moldRoot
  for (const part of dirParts) {
    if (!fs.existsSync(dir)) return false
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const found = entries.find((e) => e.isDirectory() && e.name.toLowerCase() === part.toLowerCase())
    if (!found) return false
    dir = path.join(dir, found.name)
  }
  if (!fs.existsSync(dir)) return false
  const files = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile())
  const lowerBase = filenameBase.toLowerCase()
  return files.some((f) => {
    const ext = path.extname(f.name).toLowerCase()
    if (!IMAGE_EXTS.includes(ext)) return false
    return path.basename(f.name, ext).toLowerCase() === lowerBase
  })
}

function moldFileResolved(rel) {
  const clean = rel.replace(/\\/g, '/').replace(/^\//, '')
  const lastSlash = clean.lastIndexOf('/')
  const dirPart = lastSlash >= 0 ? clean.slice(0, lastSlash) : ''
  const fileFull = lastSlash >= 0 ? clean.slice(lastSlash + 1) : clean
  const base = fileFull.replace(/\.[^.]+$/, '')
  const dirParts = dirPart ? dirPart.split('/') : []
  const direct = path.join(moldRoot, ...dirParts, fileFull)
  if (fs.existsSync(direct)) return true
  for (const ext of IMAGE_EXTS) {
    const p = path.join(moldRoot, ...dirParts, `${base}${ext}`)
    if (fs.existsSync(p)) return true
  }
  return fileExistsCaseInsensitive(dirParts, base)
}

/** @param {string[]} candidates @returns {boolean} */
function anyResolved(candidates) {
  return candidates.some((p) => moldFileResolved(p))
}

/** Frame 下是否存在任一怪兽边框（monster*.jpg/png） */
function hasMonsterFrameFallback() {
  const frameDir = path.join(moldRoot, 'Frame')
  if (!fs.existsSync(frameDir)) return false
  const files = fs.readdirSync(frameDir, { withFileTypes: true }).filter((e) => e.isFile())
  return files.some((f) => {
    const ext = path.extname(f.name).toLowerCase()
    if (!IMAGE_EXTS.includes(ext)) return false
    const base = path.basename(f.name, ext).toLowerCase()
    return base.startsWith('monster')
  })
}

console.log('Mold 根目录:', moldRoot)
console.log('---')

const issues = []

for (const p of MOLD_EXPECTED_PATHS.attributeCn) {
  if (!moldFileResolved(p)) issues.push(`缺失属性图：${p}`)
}

if (!anyResolved(MOLD_EXPECTED_PATHS.spellIconAnyOf)) {
  issues.push(
    '缺失魔法卡右上角图标（可在以下任一位置放置 PNG/JPG）：' +
      MOLD_EXPECTED_PATHS.spellIconAnyOf.join('、'),
  )
}

if (!anyResolved(MOLD_EXPECTED_PATHS.trapIconAnyOf)) {
  issues.push(
    '缺失陷阱卡右上角图标（可在以下任一位置放置 PNG/JPG）：' +
      MOLD_EXPECTED_PATHS.trapIconAnyOf.join('、'),
  )
}

if (!anyResolved(MOLD_EXPECTED_PATHS.frameMonsterAnyOf) && !hasMonsterFrameFallback()) {
  issues.push(
    '未发现怪兽卡边框图（可放置 Frame/monster_tt.jpg、Frame/monster.jpg 或任意 Frame/monster*.jpg/png）',
  )
}

if (!anyResolved(MOLD_EXPECTED_PATHS.frameSpellAnyOf)) {
  issues.push('未发现魔法卡边框（可放置 Frame/spell.jpg 或 Frame/magic.jpg 等）')
}

if (!anyResolved(MOLD_EXPECTED_PATHS.frameTrapAnyOf)) {
  issues.push('未发现陷阱卡边框（可放置 Frame/trap.jpg 等）')
}

if (issues.length === 0) {
  console.log('自检：当前 Mold 已包含预览所需的主要 PNG/JPG（或用等价命名命中）。')
} else {
  console.log('以下项仍需补齐或调整命名后放到 Mold 对应目录：')
  issues.forEach((msg) => console.log('  -', msg))
}
