const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  /** 本地路径 / file URL → Data URL（canvas 插图，绕过 webSecurity 禁止 file://） */
  readLocalImageAsDataUrl: (src) =>
    ipcRenderer.invoke('read-local-image-as-data-url', src),
  /** 主进程探测 http(s) 插图是否可访问（避免渲染进程被防盗链 / CORS 误判） */
  probeRemoteImageUrl: (url) => ipcRenderer.invoke('probe-remote-image-url', url),
  /** 主进程拉取远程图片为 Data URL，供 canvas 绘制与 PNG 导出（同源像素，无 CORS 污染） */
  fetchRemoteImageAsDataUrl: (url) =>
    ipcRenderer.invoke('fetch-remote-image-as-data-url', url),
  /** 保存对话框 + 主进程下载远程图片（卡牌数据库下载卡图） */
  saveRemoteImageAs: (payload) => ipcRenderer.invoke('save-remote-image-as', payload),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getResourcePath: () => ipcRenderer.invoke('get-resource-path'),
  getUserSettingsPath: () => ipcRenderer.invoke('get-user-settings-path'),
  getDataRootInfo: () => ipcRenderer.invoke('get-data-root-info'),
  pickDataDirectory: () => ipcRenderer.invoke('pick-data-directory'),
  applyDataDirectory: (dirPath) =>
    ipcRenderer.invoke('apply-data-directory', dirPath),
  resetDataDirectoryDefault: () =>
    ipcRenderer.invoke('reset-data-directory-default'),
  openPathInExplorer: (targetPath) =>
    ipcRenderer.invoke('open-path-in-explorer', targetPath),
  /** 在资源管理器中定位到本地文件（需绝对路径） */
  revealFileInFolder: (filePath) =>
    ipcRenderer.invoke('reveal-file-in-folder', filePath),
  readUserSettings: () => ipcRenderer.invoke('read-user-settings'),
  saveUserSettings: (settings) => ipcRenderer.invoke('save-user-settings', settings),
  getCardsPath: () => ipcRenderer.invoke('get-cards-path'),
  readCards: () => ipcRenderer.invoke('read-cards'),
  saveCards: (cards) => ipcRenderer.invoke('save-cards', cards),

  getYgoCardsRoot: () => ipcRenderer.invoke('get-ygo-cards-root'),
  readYgoDatabase: () => ipcRenderer.invoke('read-ygo-database'),
  readYgoSummary: () => ipcRenderer.invoke('read-ygo-summary'),
  readYgoDecks: () => ipcRenderer.invoke('read-ygo-decks'),
  saveYgoDecks: (payload) => ipcRenderer.invoke('save-ygo-decks', payload),
  updateYgoDatabase: () => ipcRenderer.invoke('update-ygo-database'),

  ygoCardCacheEnsure: (payload) =>
    ipcRenderer.invoke('ygo-card-cache-ensure', payload),

  ygoCardCacheRead: (cardId) =>
    ipcRenderer.invoke('ygo-card-cache-read', cardId),
  onSystemThemeChanged: (callback) => {
    const handler = (_event, theme) => callback(theme);
    ipcRenderer.on('system-theme-changed', handler);
    return () =>
      ipcRenderer.removeListener('system-theme-changed', handler);
  },

  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),
  isDevToolsOpened: () => ipcRenderer.invoke('is-devtools-opened'),
  onDevToolsStateChanged: (callback) => {
    const handler = (_event, open) => callback(open);
    ipcRenderer.on('devtools-state-changed', handler);
    return () =>
      ipcRenderer.removeListener('devtools-state-changed', handler);
  },

  onWindowMaximizedState: (callback) => {
    const handler = (_event, maximized) => callback(!!maximized);
    ipcRenderer.on('window-maximized-state', handler);
    return () =>
      ipcRenderer.removeListener('window-maximized-state', handler);
  },
  
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),

  openExternalLink: (url, useSystemBrowser) =>
    ipcRenderer.invoke('open-external-link', url, useSystemBrowser),
  closeInternalWindow: (url) =>
    ipcRenderer.invoke('close-internal-window', url),
  closeAllInternalWindows: () =>
    ipcRenderer.invoke('close-all-internal-windows'),
});
