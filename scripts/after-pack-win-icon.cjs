'use strict';

/**
 * Windows：`signAndEditExecutable: false` 时 electron-builder 不会调用内置 rcedit，
 * 否则为写入图标会拉取 winCodeSign 并在解压 darwin 符号链接时失败（无管理员/开发者模式）。
 * 打包完成后用 rcedit 自带二进制写入 `build/icon.ico`。
 *
 * 说明：不 `import('rcedit')`——rcedit@5 依赖 `import.meta.dirname`（Node ≥22.12），
 * 在 Node 20 LTS 上会触发 path.resolve(undefined)。此处直接 spawn `bin/rcedit-x64.exe`。
 *
 * @param {*} context electron-builder afterPack 上下文
 */
module.exports = async function afterPackWinIcon(context) {
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const path = require('node:path');
  const fs = require('node:fs');
  const { spawnSync } = require('node:child_process');

  const projectDir = context.packager.projectDir;
  const iconPath = path.join(projectDir, 'build', 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.warn('[after-pack-win-icon] 未找到图标，跳过:', iconPath);
    return;
  }

  const productName = context.packager.appInfo.productFilename;
  const exePath = path.join(context.appOutDir, `${productName}.exe`);
  if (!fs.existsSync(exePath)) {
    console.warn('[after-pack-win-icon] 未找到可执行文件，跳过:', exePath);
    return;
  }

  const rceditName = process.arch === 'x64' ? 'rcedit-x64.exe' : 'rcedit.exe';
  const rceditBin = path.join(projectDir, 'node_modules', 'rcedit', 'bin', rceditName);
  if (!fs.existsSync(rceditBin)) {
    console.warn('[after-pack-win-icon] 未找到 rcedit 二进制，跳过:', rceditBin);
    return;
  }

  const args = [exePath, '--set-icon', iconPath];
  const r = spawnSync(rceditBin, args, {
    stdio: 'inherit',
    encoding: 'utf8',
    windowsHide: true,
  });

  if (r.error) {
    console.warn('[after-pack-win-icon] rcedit 执行失败:', r.error.message);
    return;
  }
  if (r.status !== 0) {
    console.warn('[after-pack-win-icon] rcedit 退出码', r.status, '（已跳过写入图标）');
    return;
  }

  console.log('[after-pack-win-icon] 已写入 exe 图标:', path.basename(exePath));
};
