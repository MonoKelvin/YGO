'use strict';

/**
 * Windows：`signAndEditExecutable: false` 时 electron-builder 不会调用内置 rcedit，
 * 否则为写入图标会拉取 winCodeSign 并在解压 darwin 符号链接时失败（无管理员/开发者模式）。
 * 打包完成后用 npm `rcedit`（自带二进制）写入 `build/icon.ico`。
 *
 * @param {*} context electron-builder afterPack 上下文
 */
module.exports = async function afterPackWinIcon(context) {
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const path = require('node:path');
  const fs = require('node:fs');
  const { rcedit } = await import('rcedit');

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

  await rcedit(exePath, { icon: iconPath });
  console.log('[after-pack-win-icon] 已写入 exe 图标:', path.basename(exePath));
};
