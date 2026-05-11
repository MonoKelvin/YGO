const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/** 引导文件固定在 Electron 默认 userData，仅存指针，不与业务数据混放 */
function getBootstrapPath() {
  return path.join(app.getPath('userData'), 'data-root.json');
}

function readBootstrap() {
  const p = getBootstrapPath();
  if (!fs.existsSync(p)) {
    return { customRoot: null };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return {
      customRoot:
        typeof raw.customRoot === 'string' && raw.customRoot.trim()
          ? path.resolve(raw.customRoot.trim())
          : null,
    };
  } catch {
    return { customRoot: null };
  }
}

function writeBootstrap(data) {
  const p = getBootstrapPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function getEffectiveDataRoot() {
  const { customRoot } = readBootstrap();
  if (customRoot) {
    try {
      if (fs.existsSync(customRoot)) {
        return customRoot;
      }
    } catch {
      /* ignore */
    }
  }
  return app.getPath('userData');
}

function setCustomDataRoot(dirPath) {
  const resolved = path.resolve(dirPath);
  writeBootstrap({ customRoot: resolved });
}

function clearCustomDataRoot() {
  writeBootstrap({ customRoot: null });
}

module.exports = {
  getBootstrapPath,
  readBootstrap,
  writeBootstrap,
  getEffectiveDataRoot,
  setCustomDataRoot,
  clearCustomDataRoot,
};
