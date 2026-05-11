const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { buildYgoSummary } = require('../utils/ygoSummary.cjs');

let sqlJsFactoryPromise = null;

function locateSqlWasm(file) {
  const distLocal = path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file);
  const unpacked = path.join(
    process.resourcesPath || '',
    'app.asar.unpacked',
    'node_modules',
    'sql.js',
    'dist',
    file,
  );
  const candidates = [distLocal, unpacked];
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch (_) {
      /* ignore */
    }
  }
  return distLocal;
}

function getSqlJsFactory() {
  if (!sqlJsFactoryPromise) {
    sqlJsFactoryPromise = initSqlJs({
      locateFile: locateSqlWasm,
    });
  }
  return sqlJsFactoryPromise;
}

/** @type {{ root: string | null, db: import('sql.js').Database | null, dbPath: string | null }} */
let cache = { root: null, db: null, dbPath: null };

function invalidateDbCache() {
  if (cache.db) {
    try {
      cache.db.close();
    } catch (_) {
      /* ignore */
    }
  }
  cache = { root: null, db: null, dbPath: null };
}

function dbPathForRoot(root) {
  return path.join(root, 'ygo-data', 'library.sqlite');
}

function legacyJsonPath(root) {
  return path.join(root, 'ygo-data', 'cards.json');
}

function initSchema(db) {
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY NOT NULL,
    payload TEXT NOT NULL
  );`);
  db.run(`CREATE TABLE IF NOT EXISTS app_kv (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`);
}

function persistDbFile(db, dbPath) {
  const data = db.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function upsertKv(db, key, value) {
  db.run('INSERT OR REPLACE INTO app_kv (key, value) VALUES (?, ?)', [key, value]);
}

function getKv(db, key) {
  const stmt = db.prepare('SELECT value FROM app_kv WHERE key = ?');
  stmt.bind([key]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const v = stmt.get()[0];
  stmt.free();
  return v;
}

function readAllCardsFromDb(db) {
  const stmt = db.prepare('SELECT payload FROM cards');
  const out = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    try {
      out.push(JSON.parse(row.payload));
    } catch (_) {
      /* skip bad row */
    }
  }
  stmt.free();
  return out;
}

function rebuildSummaryKv(db) {
  const cards = readAllCardsFromDb(db);
  const summaryBody = buildYgoSummary(cards);
  upsertKv(db, 'summary', JSON.stringify(summaryBody));
}

/**
 * 从单文件 cards.json 迁移入 SQLite（仅当库为空时）
 */
function migrateLegacySingleJson(db, dbPath, root) {
  const legacy = legacyJsonPath(root);
  if (!fs.existsSync(legacy)) return;

  const check = db.exec('SELECT COUNT(*) FROM cards');
  let n = 0;
  if (check.length && check[0].values && check[0].values[0]) {
    n = Number(check[0].values[0][0]) || 0;
  }
  if (n > 0) return;

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(legacy, 'utf-8'));
  } catch {
    return;
  }
  const arr = Array.isArray(parsed.data) ? parsed.data : [];
  if (arr.length === 0) return;

  db.run('BEGIN TRANSACTION');
  const stmt = db.prepare('INSERT INTO cards (id, payload) VALUES (?, ?)');
  for (const card of arr) {
    if (card.id == null) continue;
    stmt.run([card.id, JSON.stringify(card)]);
  }
  stmt.free();
  db.run('COMMIT');

  if (parsed.meta) {
    upsertKv(db, 'library_meta', JSON.stringify(parsed.meta));
  }
  rebuildSummaryKv(db);
  persistDbFile(db, dbPath);

  try {
    fs.renameSync(legacy, `${legacy}.migrated.bak`);
  } catch (_) {
    /* ignore */
  }
}

/**
 * @param {string} root 用户数据根目录（effective）
 */
async function openDb(root) {
  if (cache.root === root && cache.db) {
    return { db: cache.db, dbPath: cache.dbPath };
  }
  if (cache.db) {
    try {
      cache.db.close();
    } catch (_) {}
  }

  const SQL = await getSqlJsFactory();
  const dbPath = dbPathForRoot(root);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  let db;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    initSchema(db);
    persistDbFile(db, dbPath);
  }

  initSchema(db);
  migrateLegacySingleJson(db, dbPath, root);

  cache = { root, db, dbPath };
  return { db, dbPath };
}

/**
 * @returns {{ cards: object[], meta: object | null, summary: object | null }}
 */
async function readLibrary(root) {
  const { db, dbPath } = await openDb(root);
  const cards = readAllCardsFromDb(db);
  let metaStr = getKv(db, 'library_meta');
  const meta = metaStr ? JSON.parse(metaStr) : null;
  let summaryStr = getKv(db, 'summary');
  let summary = summaryStr ? JSON.parse(summaryStr) : null;

  if ((!summary || !summary.total) && cards.length > 0) {
    rebuildSummaryKv(db);
    summaryStr = getKv(db, 'summary');
    summary = summaryStr ? JSON.parse(summaryStr) : null;
    persistDbFile(db, dbPath);
  }

  return { cards, meta, summary };
}

/**
 * 用 API 全量结果替换库（更新数据库按钮）
 */
async function replaceLibraryFromApi(root, apiCards, meta) {
  const { db, dbPath } = await openDb(root);
  db.run('BEGIN TRANSACTION');
  db.run('DELETE FROM cards');
  const stmt = db.prepare('INSERT INTO cards (id, payload) VALUES (?, ?)');
  for (const card of apiCards) {
    if (card.id == null) continue;
    stmt.run([card.id, JSON.stringify(card)]);
  }
  stmt.free();
  db.run('COMMIT');

  upsertKv(db, 'library_meta', JSON.stringify(meta));
  rebuildSummaryKv(db);
  persistDbFile(db, dbPath);

  const summaryStr = getKv(db, 'summary');
  const summary = summaryStr ? JSON.parse(summaryStr) : null;

  const legacy = legacyJsonPath(root);
  if (fs.existsSync(legacy)) {
    try {
      fs.renameSync(legacy, `${legacy}.replaced.by.sqlite.bak`);
    } catch (_) {}
  }

  const summaryJson = path.join(root, 'ygo-data', 'summary.json');
  if (fs.existsSync(summaryJson)) {
    try {
      fs.renameSync(summaryJson, `${summaryJson}.bak`);
    } catch (_) {}
  }

  return { count: apiCards.length, summary };
}

module.exports = {
  openDb,
  readLibrary,
  replaceLibraryFromApi,
  invalidateDbCache,
  dbPathForRoot,
};
