const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { pathToFileURL } = require('url');

function cacheRoot(dataRoot) {
  return path.join(dataRoot, 'ygo-data', 'card-cache');
}

function thumbPath(dataRoot, cardId) {
  return path.join(cacheRoot(dataRoot), `${cardId}.jpg`);
}

function metaPath(dataRoot, cardId) {
  return path.join(cacheRoot(dataRoot), `${cardId}.json`);
}

function downloadToFile(urlStr, destPath) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(urlStr);
    } catch (e) {
      reject(e);
      return;
    }
    const lib = url.protocol === 'https:' ? https : http;
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${destPath}.part`;
    const file = fs.createWriteStream(tmp);
    const req = lib.get(url, (res) => {
      if (
        res.statusCode === 301 ||
        res.statusCode === 302 ||
        res.statusCode === 307 ||
        res.statusCode === 308
      ) {
        const loc = res.headers.location;
        file.close();
        try {
          fs.unlinkSync(tmp);
        } catch (_) {
          /* ignore */
        }
        if (!loc) {
          reject(new Error('redirect without location'));
          return;
        }
        const next = new URL(loc, url).href;
        downloadToFile(next, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        try {
          fs.unlinkSync(tmp);
        } catch (_) {
          /* ignore */
        }
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          try {
            fs.renameSync(tmp, destPath);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
    req.on('error', (err) => {
      try {
        file.close();
        fs.unlinkSync(tmp);
      } catch (_) {
        /* ignore */
      }
      reject(err);
    });
  });
}

/**
 * @param {string} dataRoot
 * @param {{ id: number, imageUrl: string, meta?: Record<string, unknown> }} opts
 */
async function ensureCardCache(dataRoot, opts) {
  const id = opts.id;
  if (id == null || !opts.imageUrl) {
    return { success: false, error: 'missing id or imageUrl' };
  }
  const tp = thumbPath(dataRoot, id);
  const mp = metaPath(dataRoot, id);
  fs.mkdirSync(cacheRoot(dataRoot), { recursive: true });

  let wroteThumb = false;
  if (!fs.existsSync(tp)) {
    try {
      await downloadToFile(opts.imageUrl, tp);
      wroteThumb = true;
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }

  const meta = {
    ...(opts.meta && typeof opts.meta === 'object' ? opts.meta : {}),
    id,
    cachedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(mp, JSON.stringify(meta, null, 2), 'utf-8');
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }

  const thumbFileUrl = pathToFileURL(tp).href;
  return {
    success: true,
    thumbPath: tp,
    metaPath: mp,
    thumbFileUrl,
    wroteThumb,
  };
}

function readCachedThumbUrl(dataRoot, cardId) {
  const tp = thumbPath(dataRoot, cardId);
  if (!fs.existsSync(tp)) return null;
  try {
    return pathToFileURL(tp).href;
  } catch {
    return null;
  }
}

function readCachedMeta(dataRoot, cardId) {
  const mp = metaPath(dataRoot, cardId);
  if (!fs.existsSync(mp)) return null;
  try {
    return JSON.parse(fs.readFileSync(mp, 'utf-8'));
  } catch {
    return null;
  }
}

module.exports = {
  cacheRoot,
  thumbPath,
  metaPath,
  ensureCardCache,
  readCachedThumbUrl,
  readCachedMeta,
}
