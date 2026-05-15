/**
 * 一键发布版打包：生产构建 Vite + electron-builder 生成当前平台安装包。
 *
 * 用法：
 *   node scripts/package-release.mjs              # 自动：win→NSIS exe，darwin→dmg，linux→AppImage
 *   node scripts/package-release.mjs --win       # 仅 Windows（需在 Windows 上执行以生成 NSIS）
 *   node scripts/package-release.mjs --mac     # 仅 macOS
 *   node scripts/package-release.mjs --linux    # 仅 Linux
 *   node scripts/package-release.mjs --skip-build   # 跳过 npm run build（dist 已存在时）
 *
 * 环境变量（可选）：
 *   CSC_IDENTITY_AUTO_DISCOVERY=false   # mac 无签名证书时避免卡住（脚本已默认传入）
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureAppIcons } from './ensure-app-icons.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const args = process.argv.slice(2)
const skipBuild = args.includes('--skip-build')
const wantWin = args.includes('--win')
const wantMac = args.includes('--mac')
const wantLinux = args.includes('--linux')
const explicit = wantWin || wantMac || wantLinux

function run(cmd, cmdArgs, extra = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extra.env },
    ...extra,
  })
  if (result.status !== 0 && result.status != null) {
    console.error(`\n[package-release] 命令失败: ${cmd} ${cmdArgs.join(' ')} (exit ${result.status})\n`)
    process.exit(result.status)
  }
  if (result.error) {
    console.error('[package-release]', result.error)
    process.exit(1)
  }
}

/** 从 src/assets/app 生成 build/icon.png 与 build/icon.ico */
async function preparePackagingIcons() {
  await ensureAppIcons()
  console.log('[package-release] 已从 src/assets/app 生成 build/icon.png / build/icon.ico（取最大尺寸 logo-NxN.png 为母图）')
}

function pickTargets() {
  if (explicit) {
    const t = []
    if (wantWin) t.push('win')
    if (wantMac) t.push('mac')
    if (wantLinux) t.push('linux')
    return t
  }
  if (process.platform === 'win32') return ['win']
  if (process.platform === 'darwin') return ['mac']
  return ['linux']
}

function electronBuilderArgs(targets) {
  const out = ['electron-builder', 'build', '--publish', 'never']
  const env = {
    NODE_ENV: 'production',
    CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY ?? 'false',
  }

  if (targets.includes('win')) {
    out.push('--win', '--x64')
  }
  if (targets.includes('mac')) {
    out.push('--mac')
  }
  if (targets.includes('linux')) {
    out.push('--linux')
  }
  return { args: out, env }
}

function listArtifacts() {
  const outDir = join(root, 'dist_electron')
  if (!existsSync(outDir)) return
  console.log('\n[package-release] 输出目录 dist_electron：')
  try {
    const names = readdirSync(outDir).filter((n) => {
      const p = join(outDir, n)
      return statSync(p).isFile()
    })
    if (!names.length) {
      console.log('  (无文件，请检查 electron-builder 日志)')
      return
    }
    names.sort().forEach((n) => console.log('  -', n))
  } catch (e) {
    console.warn('[package-release] 无法列出 dist_electron:', e.message)
  }
}

async function main() {
  console.log('[package-release] 工作目录:', root)
  await preparePackagingIcons()

  if (!skipBuild) {
    console.log('\n[package-release] 1/2 生产构建渲染进程 (NODE_ENV=production)…')
    run('npm', ['run', 'build'], { env: { NODE_ENV: 'production' } })
  } else {
    console.log('\n[package-release] 已跳过 npm run build（--skip-build）')
    if (!existsSync(join(root, 'dist', 'index.html'))) {
      console.error('[package-release] dist 不存在或无效，请先执行 npm run build')
      process.exit(1)
    }
  }

  const targets = pickTargets()
  console.log('\n[package-release] 2/2 electron-builder 目标:', targets.join(', '))

  const outDir = join(root, 'dist_electron')
  if (existsSync(outDir)) {
    console.log('[package-release] 清理旧输出:', outDir)
    rmSync(outDir, { recursive: true, force: true })
  }

  const { args: ebArgs, env: ebEnv } = electronBuilderArgs(targets)
  run('npx', ebArgs, { env: ebEnv })

  listArtifacts()
  console.log('\n[package-release] 完成。\n')
}

main().catch((err) => {
  console.error('[package-release] 未捕获错误:', err)
  process.exit(1)
})
