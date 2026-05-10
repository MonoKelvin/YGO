const { app, BrowserWindow, ipcMain, dialog, nativeTheme, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 550,
    frame: false,
    show: false,
    backgroundColor: '#1a1d24',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
    filters: options.filters || [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
  });
  return result;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options.defaultPath,
    filters: options.filters || [{ name: 'PNG Image', extensions: ['png'] }]
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

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-resource-path', () => {
  if (isDev) {
    return path.join(__dirname, '../src/assets');
  }
  return path.join(process.resourcesPath, 'assets');
});

ipcMain.handle('get-user-settings-path', () => {
  return path.join(app.getPath('userData'), 'settings.json');
});

ipcMain.handle('read-user-settings', async () => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
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
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-cards-path', () => {
  return path.join(app.getPath('userData'), 'cards.json');
});

ipcMain.handle('read-cards', async () => {
  const cardsPath = path.join(app.getPath('userData'), 'cards.json');
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
  const cardsPath = path.join(app.getPath('userData'), 'cards.json');
  try {
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
  if (mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools();
  } else {
    mainWindow.webContents.openDevTools();
  }
});

ipcMain.handle('is-devtools-opened', () => {
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
