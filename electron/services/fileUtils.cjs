const fs = require('fs');
const path = require('path');

/** 将 src 目录内条目复制到 dest（dest 须已存在或为新建根目录） */
function copyDirectoryContents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    const from = path.join(srcDir, ent.name);
    const to = path.join(destDir, ent.name);
    if (ent.name === 'data-root.json') {
      continue;
    }
    if (ent.isDirectory()) {
      copyDirectoryContents(from, to);
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
}

module.exports = { copyDirectoryContents };
