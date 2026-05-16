const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    nativeTheme,
    globalShortcut,
    shell,
    Menu,
    clipboard,
    nativeImage,
    net,
} = require('electron');
const { fileURLToPath } = require('url');

/** 存储创建的子窗口，用于管理窗口生命周期 */
const childWindows = new Map();
const path = require('path');
const fs = require('fs');

const {
    loadWindowState,
    constrainBounds,
    attachWindowStatePersistence,
    DEFAULT_BOUNDS,
} = require('./services/windowState.cjs');

const {
    getEffectiveDataRoot,
    setCustomDataRoot,
    clearCustomDataRoot,
    readBootstrap,
    getBootstrapPath,
} = require('./services/dataRoot.cjs');

const paths = require('./services/paths.cjs');
const { resolveAppIconPath } = require('./services/appIcon.cjs');
const { copyDirectoryContents } = require('./services/fileUtils.cjs');
const ygoCardCache = require('./services/ygoCardCache.cjs');

const { getContextMenuLabels } = require('./services/contextMenuI18n.cjs');

const { readLibrary, replaceLibraryFromApi, invalidateDbCache } = require('./services/ygoLibraryDb.cjs');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 开发模式：Vite 可能尚未监听，或 Chromium Network service 短暂异常导致 ERR_FAILED，
 * 对 loadURL 做多次重试通常可恢复。
 */
async function loadDevUrlWithRetry(win, url, attempts = 30, delayMs = 500) {
    let lastErr;

    for (let i = 0; i < attempts; i++) {
        if (win.isDestroyed()) return;

        try {
            await win.loadURL(url);

            if (i > 0) {
                console.log(`[electron] 开发页已加载（第 ${i + 1} 次尝试）`);
            }

            return;
        } catch (err) {
            lastErr = err;

            const msg = err && err.message ? err.message : String(err);

            console.warn(`[electron] loadURL 失败 (${i + 1}/${attempts})，${delayMs}ms 后重试: ${msg}`);

            await sleep(delayMs);
        }
    }

    console.error(
        '[electron] 多次重试后仍无法加载开发服务器。',
        '\n  • 请使用 `npm run dev` 或 `npm run desktop:dev`（会先等 Vite 端口再起 Electron）；',
        '\n  • 若单独运行 electron，请先执行 `npm run vite:dev`；',
        '\n  • 确认地址与 VITE_DEV_SERVER_URL 一致（默认 http://127.0.0.1:5173）。',
        '\n  最后一次错误:',
        lastErr,
    );
}

let mainWindow = null;

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;

function packagedCardsRoot() {
    return isDev ? path.join(__dirname, '../src/assets/cards') : path.join(process.resourcesPath, 'assets', 'cards');
}

function packagedCardsJson() {
    return path.join(packagedCardsRoot(), 'data', 'cards.json');
}

function packagedSummaryJson() {
    return path.join(packagedCardsRoot(), 'data', 'summary.json');
}

async function readUserLibraryOrEmpty() {
    const root = getEffectiveDataRoot();

    try {
        return await readLibrary(root);
    } catch (e) {
        console.error('[ygo] readLibrary failed:', e);

        return { cards: [], meta: null, summary: null };
    }
}

function normalizeSummaryShape(summary, meta) {
    if (!summary) return null;

    const total = summary.total ?? 0;

    const metaBlock =
        meta && typeof meta === 'object'
            ? {
                generatedAt: meta.fetchedAt || meta.generatedAt,
                total,
            }
            : { generatedAt: undefined, total };

    return {
        meta: metaBlock,

        ...summary,
    };
}

function createWindow() {
    const saved = loadWindowState();

    const bounds = constrainBounds({
        width: saved.width,
        height: saved.height,
        x: saved.x,
        y: saved.y,
    });

    const winOptions = {
        width: bounds.width,
        height: bounds.height,
        minWidth: DEFAULT_BOUNDS.minWidth,
        minHeight: DEFAULT_BOUNDS.minHeight,
        frame: false,
        show: false,
        backgroundColor: '#0a0b0e',
        icon: resolveAppIconPath(),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
        },
    };

    if (bounds.x != null && bounds.y != null) {
        winOptions.x = bounds.x;
        winOptions.y = bounds.y;
    }

    mainWindow = new BrowserWindow(winOptions);

    const normalBounds = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
    };
    attachWindowStatePersistence(mainWindow, normalBounds);
    attachRendererContextMenu(mainWindow);
    mainWindow.once('ready-to-show', () => {
        if (saved.isMaximized) {
            mainWindow.maximize();
        }
        mainWindow.show();
    });

    /** 个别环境下 ready-to-show 迟迟不触发，保证开发者能看见窗口 */

    const forceShowTimer = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
            mainWindow.show();
        }
    }, 2500);

    if (isDev) {
        const devUrl = process.env.VITE_DEV_SERVER_URL;

        if (!devUrl) {
            console.error('[electron] 缺少环境变量 VITE_DEV_SERVER_URL，无法加载开发服务器');
        } else {
            mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
                console.error('[electron] 页面加载失败', { code, desc, url });
            });

            void loadDevUrlWithRetry(mainWindow, devUrl);
        }
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        clearTimeout(forceShowTimer);
        mainWindow = null;
    });

    attachDevToolsBridge(mainWindow);
    attachWindowMaximizeBridge(mainWindow);
}

/**
 * Chromium 在 Electron 内默认不弹出右键菜单，需在主进程响应 context-menu。
 * 使用系统 locale 的文案（见 contextMenuI18n.cjs），避免 role 菜单项固定为英文。
 */
function attachRendererContextMenu(win) {
    if (!win || win.isDestroyed()) return;

    win.webContents.on('context-menu', (_event, params) => {
        const editFlags = params.editFlags || {};
        const labels = getContextMenuLabels(app);
        const wc = win.webContents;

        const template = [];

        if (params.isEditable) {
            template.push(
                { label: labels.undo, enabled: editFlags.canUndo, click: () => wc.undo() },
                { label: labels.redo, enabled: editFlags.canRedo, click: () => wc.redo() },
                { type: 'separator' },
                { label: labels.cut, enabled: editFlags.canCut, click: () => wc.cut() },
                { label: labels.copy, enabled: editFlags.canCopy, click: () => wc.copy() },
                { label: labels.paste, enabled: editFlags.canPaste, click: () => wc.paste() },
                {
                    label: labels.pasteAndMatchStyle,
                    enabled: editFlags.canPaste,
                    click: () => wc.pasteAndMatchStyle(),
                },
                { type: 'separator' },
                { label: labels.delete, enabled: editFlags.canDelete, click: () => wc.delete() },
                { type: 'separator' },
                { label: labels.selectAll, enabled: editFlags.canSelectAll, click: () => wc.selectAll() },
            );
        } else {
            if (params.selectionText && String(params.selectionText).trim()) {
                template.push({ label: labels.copy, click: () => wc.copy() });
            }

            if (params.linkURL) {
                template.push({
                    label: labels.copyLink,

                    click: () => {
                        clipboard.writeText(params.linkURL);
                    },
                });
            }
        }

        if (template.length === 0) return;

        const menu = Menu.buildFromTemplate(template);

        menu.popup({ window: win });
    });
}

function attachWindowMaximizeBridge(win) {
    if (!win || win.isDestroyed()) return;

    const push = () => {
        if (win.isDestroyed()) return;

        try {
            win.webContents.send('window-maximized-state', win.isMaximized());
        } catch (_) {
            /* ignore */
        }
    };

    win.on('maximize', push);
    win.on('unmaximize', push);
    win.on('enter-full-screen', push);
    win.on('leave-full-screen', push);
}

/** DevTools 独立窗口 + 向渲染进程同步开关状态 */

function attachDevToolsBridge(win) {
    if (!win || win.isDestroyed()) return;

    const pushDevToolsState = () => {
        if (win.isDestroyed()) return;

        const open = win.webContents.isDevToolsOpened();
        win.webContents.send('devtools-state-changed', open);
    };

    win.webContents.on('devtools-opened', pushDevToolsState);
    win.webContents.on('devtools-closed', pushDevToolsState);
}

function registerDevToolsShortcut() {
    try {
        globalShortcut.unregister('CommandOrControl+Shift+I');
    } catch (_) {
        /* ignore */
    }

    const ok = globalShortcut.register('CommandOrControl+Shift+I', () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;

        const wc = mainWindow.webContents;

        if (wc.isDevToolsOpened()) {
            wc.closeDevTools();
        } else {
            wc.openDevTools({ mode: 'detach' });
        }

        wc.send('devtools-state-changed', wc.isDevToolsOpened());
    });

    if (!ok) {
        console.warn('[electron] 快捷键 Ctrl+Shift+I 注册失败（可能被系统占用）');
    }
}

app.whenReady().then(() => {
    createWindow();

    registerDevToolsShortcut();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();

            registerDevToolsShortcut();
        }
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('get-system-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

ipcMain.handle('open-file-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],

        filters: options.filters || [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }],
    });

    return result;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: options.title || undefined,

        defaultPath: options.defaultPath,

        filters: options.filters || [{ name: 'PNG Image', extensions: ['png'] }],
    });

    return result;
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const data = fs.readFileSync(filePath);

        return { success: true, data: data.toString('base64') };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

/**
 * 将本地插图读成 Data URL，供渲染进程在 webSecurity 下绘制到 canvas（避免 http 页无法加载 file://）
 */
ipcMain.handle('read-local-image-as-data-url', async (_event, srcRaw) => {
    try {
        const raw = String(srcRaw || '').trim();
        if (!raw) {
            return { success: false, error: 'empty' };
        }
        let fp = '';
        if (/^file:/i.test(raw)) {
            fp = fileURLToPath(raw);
        } else if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith('\\\\')) {
            fp = path.normalize(raw);
        } else if (raw.startsWith('/')) {
            fp = raw;
        } else {
            return { success: false, error: 'unsupported path' };
        }
        if (!fs.existsSync(fp)) {
            return { success: false, error: 'not found' };
        }
        const ni = nativeImage.createFromPath(fp);
        if (ni.isEmpty()) {
            return { success: false, error: 'invalid image' };
        }
        return { success: true, dataUrl: ni.toDataURL() };
    } catch (error) {
        return { success: false, error: error && error.message ? error.message : String(error) };
    }
});

/** 与常见浏览器一致的 UA，减少 CDN / 防盗链对 Electron 默认 UA 的拦截 */
const REMOTE_IMAGE_FETCH_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
};

/**
 * 轻量探测远程 URL（HEAD）。不支持 HEAD 的站点会失败并回退到渲染进程 `<img>` 探测。
 */
ipcMain.handle('probe-remote-image-url', async (_event, urlRaw) => {
    const url = String(urlRaw || '').trim();
    if (!/^https?:\/\//i.test(url)) {
        return { success: false, error: 'invalid url' };
    }
    try {
        const headRes = await net.fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            headers: REMOTE_IMAGE_FETCH_HEADERS,
        });
        if (!headRes.ok) {
            return { success: false, error: `HTTP ${headRes.status}` };
        }
        const ct = (headRes.headers.get('content-type') || '').toLowerCase();
        if (ct.startsWith('image/') || ct.includes('octet-stream') || !ct.trim()) {
            return { success: true };
        }
        return { success: false, error: 'unexpected content-type' };
    } catch (error) {
        return { success: false, error: error && error.message ? error.message : String(error) };
    }
});

/**
 * 主进程拉取远程图片并转为 Data URL，供 canvas 绘制（避免渲染进程 CORS / 防盗链；导出 PNG 时画布不被污染）
 */
ipcMain.handle('fetch-remote-image-as-data-url', async (_event, urlRaw) => {
    const url = String(urlRaw || '').trim();
    if (!/^https?:\/\//i.test(url)) {
        return { success: false, error: 'invalid url' };
    }
    const maxBytes = 40 * 1024 * 1024;
    try {
        const res = await net.fetch(url, {
            redirect: 'follow',
            headers: REMOTE_IMAGE_FETCH_HEADERS,
        });
        if (!res.ok) {
            return { success: false, error: `HTTP ${res.status}` };
        }
        const cl = res.headers.get('content-length');
        if (cl && Number(cl) > maxBytes) {
            return { success: false, error: 'image too large' };
        }
        const ab = await res.arrayBuffer();
        if (ab.byteLength > maxBytes) {
            return { success: false, error: 'image too large' };
        }
        const buf = Buffer.from(ab);
        const ni = nativeImage.createFromBuffer(buf);
        if (!ni.isEmpty()) {
            return { success: true, dataUrl: ni.toDataURL() };
        }
        const head = buf
            .subarray(0, Math.min(2048, buf.length))
            .toString('utf8')
            .replace(/^\uFEFF/, '')
            .trimStart();
        if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
            return {
                success: true,
                dataUrl: `data:image/svg+xml;base64,${buf.toString('base64')}`,
            };
        }
        return { success: false, error: 'invalid or unsupported image' };
    } catch (error) {
        return { success: false, error: error && error.message ? error.message : String(error) };
    }
});

/**
 * 先弹出保存对话框，再由主进程拉取远程图片写入（避免渲染进程打开图片预览窗口）
 */
ipcMain.handle('save-remote-image-as', async (_event, payload) => {
    const url = String(payload?.url || '').trim();
    const defaultPath = String(payload?.defaultPath || 'card.jpg').trim();
    if (!/^https?:\/\//i.test(url)) {
        return { success: false, error: 'invalid url' };
    }
    const maxBytes = 40 * 1024 * 1024;
    try {
        const dlg = await dialog.showSaveDialog(mainWindow, {
            title: '保存卡图',
            defaultPath,
            filters: [
                { name: '图像', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
                { name: '所有文件', extensions: ['*'] },
            ],
        });
        if (dlg.canceled || !dlg.filePath) {
            return { success: false, canceled: true };
        }

        const res = await net.fetch(url, {
            redirect: 'follow',
            headers: REMOTE_IMAGE_FETCH_HEADERS,
        });
        if (!res.ok) {
            return { success: false, error: `HTTP ${res.status}` };
        }
        const cl = res.headers.get('content-length');
        if (cl && Number(cl) > maxBytes) {
            return { success: false, error: 'image too large' };
        }
        const ab = await res.arrayBuffer();
        if (ab.byteLength > maxBytes) {
            return { success: false, error: 'image too large' };
        }
        fs.writeFileSync(dlg.filePath, Buffer.from(ab));
        return { success: true, filePath: dlg.filePath };
    } catch (error) {
        return { success: false, error: error && error.message ? error.message : String(error) };
    }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
    try {
        const buffer = Buffer.from(data, 'base64');

        fs.writeFileSync(filePath, buffer);

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

/** 当前生效的用户数据根目录（可与默认 userData 不同） */

ipcMain.handle('get-app-path', () => {
    return getEffectiveDataRoot();
});

ipcMain.handle('get-resource-path', () => {
    if (isDev) {
        return path.join(__dirname, '../src/assets');
    }

    return path.join(process.resourcesPath, 'assets');
});

ipcMain.handle('get-user-settings-path', () => {
    return paths.settingsFile();
});

ipcMain.handle('read-user-settings', async () => {
    const settingsPath = paths.settingsFile();

    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf-8');

            return { success: true, data: JSON.parse(data) };
        }

        return { success: true, data: null };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-user-settings', async (event, settings) => {
    const settingsPath = paths.settingsFile();

    try {
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-cards-path', () => {
    return paths.diyCardsFile();
});

ipcMain.handle('get-ygo-cards-root', () => {
    return packagedCardsRoot();
});

ipcMain.handle('get-data-root-info', () => {
    const bootstrap = readBootstrap();

    const defaultPath = app.getPath('userData');

    const effectivePath = getEffectiveDataRoot();

    let hasCustom = false;

    if (bootstrap.customRoot) {
        try {
            hasCustom = fs.existsSync(bootstrap.customRoot);
        } catch (_) {
            hasCustom = false;
        }
    }

    return {
        effectivePath,

        defaultPath,

        bootstrapPath: getBootstrapPath(),

        hasCustom,

        customRoot: bootstrap.customRoot || null,
    };
});

ipcMain.handle('pick-data-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || !result.filePaths?.length) {
        return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
});

ipcMain.handle('apply-data-directory', async (_event, newRootRaw) => {
    const newRoot = path.resolve(String(newRootRaw || '').trim());

    if (!newRoot) {
        return { success: false, error: '路径无效' };
    }

    const oldRoot = path.resolve(getEffectiveDataRoot());

    const normalizedNew = path.resolve(newRoot);

    if (normalizedNew === oldRoot) {
        return { success: true, unchanged: true, effectivePath: normalizedNew };
    }

    if (normalizedNew.startsWith(oldRoot + path.sep)) {
        return { success: false, error: '不能使用当前数据目录内的子文件夹作为新位置' };
    }

    try {
        fs.mkdirSync(normalizedNew, { recursive: true });

        copyDirectoryContents(oldRoot, normalizedNew);

        setCustomDataRoot(normalizedNew);

        invalidateDbCache();

        return { success: true, effectivePath: normalizedNew };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('reset-data-directory-default', async () => {
    const defaultPath = path.resolve(app.getPath('userData'));

    const oldRoot = path.resolve(getEffectiveDataRoot());

    if (oldRoot === defaultPath) {
        clearCustomDataRoot();

        invalidateDbCache();

        return { success: true, unchanged: true, effectivePath: defaultPath };
    }

    try {
        fs.mkdirSync(defaultPath, { recursive: true });

        copyDirectoryContents(oldRoot, defaultPath);

        clearCustomDataRoot();

        invalidateDbCache();

        return { success: true, effectivePath: defaultPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('open-path-in-explorer', async (_event, targetPath) => {
    const p = String(targetPath || '').trim();

    if (!p) {
        return { success: false, error: '路径为空' };
    }

    const err = await shell.openPath(p);

    if (err) {
        return { success: false, error: err };
    }

    return { success: true };
});

ipcMain.handle('reveal-file-in-folder', async (_event, filePath) => {
    const p = String(filePath || '').trim();

    if (!p) {
        return { success: false, error: '路径为空' };
    }

    try {
        if (!fs.existsSync(p)) {
            return { success: false, error: '文件不存在' };
        }

        shell.showItemInFolder(p);

        return { success: true };
    } catch (error) {
        return { success: false, error: error?.message || String(error) };
    }
});

ipcMain.handle('read-ygo-database', async () => {
    const lib = await readUserLibraryOrEmpty();

    if (lib.cards.length > 0) {
        return {
            success: true,

            missing: false,

            data: lib.cards,

            meta: lib.meta,

            source: 'userdata',
        };
    }

    const packagedDb = packagedCardsJson();

    if (fs.existsSync(packagedDb)) {
        try {
            const raw = fs.readFileSync(packagedDb, 'utf-8');

            const parsed = JSON.parse(raw);

            return {
                success: true,

                missing: false,

                data: parsed.data || [],

                meta: parsed.meta || null,

                source: 'packaged',
            };
        } catch (_) {
            /* fall through */
        }
    }

    return { success: true, missing: true, data: null, meta: null, source: null };
});

ipcMain.handle('read-ygo-summary', async () => {
    const lib = await readUserLibraryOrEmpty();

    if (lib.summary && (lib.summary.total != null || lib.cards.length > 0)) {
        const shaped = normalizeSummaryShape(lib.summary, lib.meta);

        return { success: true, missing: false, summary: shaped };
    }

    const userSummaryFile = paths.summaryJsonFile();

    const packagedSummary = packagedSummaryJson();

    for (const p of [userSummaryFile, packagedSummary]) {
        if (!fs.existsSync(p)) continue;

        try {
            const summary = JSON.parse(fs.readFileSync(p, 'utf-8'));

            return { success: true, missing: false, summary };
        } catch (_) {
            /* try next */
        }
    }

    return { success: true, missing: true, summary: null };
});

/** 下载全库 JSON + summary 到用户目录（可选离线；卡图仍可用 CDN） */

ipcMain.handle('update-ygo-database', async () => {
    try {
        const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php', {
            headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
            return { success: false, error: `HTTP ${res.status}` };
        }

        const json = await res.json();

        if (!json.data || !Array.isArray(json.data)) {
            return { success: false, error: 'API 未返回 data' };
        }

        const meta = {
            source: 'YGOProDeck API v7',
            sourceUrl: 'https://db.ygoprodeck.com/api/v7/cardinfo.php',
            fetchedAt: new Date().toISOString(),
            count: json.data.length,
        };

        const root = getEffectiveDataRoot();

        fs.mkdirSync(paths.ygoDataDir(), { recursive: true });

        await replaceLibraryFromApi(root, json.data, meta);

        return { success: true, count: json.data.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('read-ygo-decks', async () => {
    const p = paths.decksFile();

    try {
        if (!fs.existsSync(p)) {
            return {
                success: true,

                data: { main: [], extra: [], name: '我的卡组', snapshots: {} },
            };
        }

        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-ygo-decks', async (event, payload) => {
    const p = paths.decksFile();

    try {
        fs.mkdirSync(path.dirname(p), { recursive: true });

        fs.writeFileSync(p, JSON.stringify(payload, null, 2));

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('ygo-card-cache-ensure', async (_event, payload) => {
    try {
        const root = getEffectiveDataRoot();

        return await ygoCardCache.ensureCardCache(root, payload);
    } catch (error) {
        return { success: false, error: error.message || String(error) };
    }
});

ipcMain.handle('ygo-card-cache-read', async (_event, cardId) => {
    try {
        const root = getEffectiveDataRoot();

        const thumbFileUrl = ygoCardCache.readCachedThumbUrl(root, cardId);

        const meta = ygoCardCache.readCachedMeta(root, cardId);

        return { success: true, thumbFileUrl, meta };
    } catch (error) {
        return { success: false, error: error.message || String(error) };
    }
});

ipcMain.handle('read-cards', async () => {
    const cardsPath = paths.diyCardsFile();

    try {
        if (fs.existsSync(cardsPath)) {
            const data = fs.readFileSync(cardsPath, 'utf-8');

            return { success: true, data: JSON.parse(data) };
        }

        return { success: true, data: [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-cards', async (event, cards) => {
    const cardsPath = paths.diyCardsFile();

    try {
        fs.mkdirSync(path.dirname(cardsPath), { recursive: true });

        fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.handle('window-close', () => {
    mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow.isMaximized();
});

ipcMain.handle('toggle-devtools', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return false;

    const wc = mainWindow.webContents;

    if (wc.isDevToolsOpened()) {
        wc.closeDevTools();
    } else {
        wc.openDevTools({ mode: 'detach' });
    }

    const open = wc.isDevToolsOpened();

    wc.send('devtools-state-changed', open);

    return open;
});

ipcMain.handle('is-devtools-opened', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return false;

    return mainWindow.webContents.isDevToolsOpened();
});

ipcMain.on('set-theme', (event, theme) => {
    if (theme === 'system') {
        nativeTheme.themeSource = 'system';
    } else if (theme === 'dark') {
        nativeTheme.themeSource = 'dark';
    } else {
        nativeTheme.themeSource = 'light';
    }
});

nativeTheme.on('updated', () => {
    if (mainWindow) {
        mainWindow.webContents.send('system-theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    }
});

/**
 * 打开外部链接
 * @param {string} url - 要打开的链接
 * @param {boolean} useSystemBrowser - 是否使用系统浏览器，true 使用系统默认浏览器，false 使用软件内部窗口
 */
ipcMain.handle('open-external-link', async (_event, url, useSystemBrowser = true) => {
    if (!url || typeof url !== 'string') {
        return { success: false, error: '链接地址无效' };
    }

    // 验证 URL 格式
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
        // 只允许 http 和 https 协议
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return { success: false, error: '不支持的链接协议' };
        }
    } catch (e) {
        return { success: false, error: '链接格式无效' };
    }

    if (useSystemBrowser) {
        // 使用系统默认浏览器打开
        try {
            await shell.openExternal(url);
            return { success: true, mode: 'system' };
        } catch (error) {
            return { success: false, error: error.message || '打开链接失败' };
        }
    } else {
        // 使用软件内部窗口打开（无边框）
        try {
            // 如果窗口已存在，则聚焦并导航到新 URL
            let childWin = childWindows.get(url);
            if (childWin && !childWin.isDestroyed()) {
                childWin.focus();
                // 如果 URL 不同，重新加载
                if (childWin.webContents.getURL() !== url) {
                    childWin.loadURL(url);
                }
                return { success: true, mode: 'internal', windowId: url };
            }

            // 创建新的无边框窗口
            const winOptions = {
                width: 1200,
                height: 800,
                minWidth: 800,
                minHeight: 600,
                frame: false, // 无边框
                show: false,
                backgroundColor: '#0a0b0e',
                icon: resolveAppIconPath(),
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: true,
                },
                // 窗口控制按钮（在 macOS 上显示，Windows/Linux 无边框）
                titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
            };

            childWin = new BrowserWindow(winOptions);

            // 存储窗口引用
            childWindows.set(url, childWin);

            // 窗口准备好后显示
            childWin.once('ready-to-show', () => {
                childWin.show();
            });

            // 加载 URL
            await childWin.loadURL(url);

            // 窗口关闭时清理引用
            childWin.on('closed', () => {
                childWindows.delete(url);
            });

            // 为内部窗口添加右键菜单支持
            attachRendererContextMenu(childWin);

            return { success: true, mode: 'internal', windowId: url };
        } catch (error) {
            return { success: false, error: error.message || '创建窗口失败' };
        }
    }
});

/**
 * 关闭指定 URL 的内部窗口
 */
ipcMain.handle('close-internal-window', async (_event, url) => {
    const childWin = childWindows.get(url);
    if (childWin && !childWin.isDestroyed()) {
        childWin.close();
        childWindows.delete(url);
        return { success: true };
    }
    return { success: false, error: '窗口不存在或已关闭' };
});

/**
 * 关闭所有内部窗口
 */
ipcMain.handle('close-all-internal-windows', async () => {
    const urls = Array.from(childWindows.keys());
    for (const url of urls) {
        const childWin = childWindows.get(url);
        if (childWin && !childWin.isDestroyed()) {
            childWin.close();
        }
        childWindows.delete(url);
    }
    return { success: true, closedCount: urls.length };
});
