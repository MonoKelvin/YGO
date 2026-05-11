const fs = require('fs');
const path = require('path');
const { screen } = require('electron');
const paths = require('./paths.cjs');

const DEFAULT_BOUNDS = {
  width: 1000,
  height: 700,
  minWidth: 800,
  minHeight: 550,
};

function windowStatePath() {
  return paths.windowStateFile();
}

function clamp(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

/**
 * @returns {{ width: number, height: number, x?: number, y?: number, isMaximized: boolean }}
 */
function loadWindowState() {
  const filePath = windowStatePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const width = clamp(raw.width, 400, 5000, DEFAULT_BOUNDS.width);
      const height = clamp(raw.height, 300, 5000, DEFAULT_BOUNDS.height);
      const x =
        raw.x != null && Number.isFinite(Number(raw.x)) ? Math.round(Number(raw.x)) : undefined;
      const y =
        raw.y != null && Number.isFinite(Number(raw.y)) ? Math.round(Number(raw.y)) : undefined;
      return {
        width,
        height,
        x,
        y,
        isMaximized: Boolean(raw.isMaximized),
      };
    }
  } catch (e) {
    console.warn('[ygo] loadWindowState failed:', e.message);
  }
  return {
    width: DEFAULT_BOUNDS.width,
    height: DEFAULT_BOUNDS.height,
    x: undefined,
    y: undefined,
    isMaximized: false,
  };
}

/**
 * 将窗口坐标约束到可见工作区内（多显示器、分辨率变更后仍可出现）
 */
function constrainBounds(bounds) {
  const { width, height } = bounds;
  let { x, y } = bounds;
  if (x == null || y == null) return bounds;

  const displays = screen.getAllDisplays();
  let contained = false;
  for (const d of displays) {
    const wa = d.workArea;
    const intersects =
      x + width > wa.x &&
      x < wa.x + wa.width &&
      y + height > wa.y &&
      y < wa.y + wa.height;
    if (intersects) {
      contained = true;
      break;
    }
  }

  if (!contained && displays.length > 0) {
    const primary = screen.getPrimaryDisplay().workArea;
    x = primary.x + Math.max(0, Math.floor((primary.width - width) / 2));
    y = primary.y + Math.max(0, Math.floor((primary.height - height) / 2));
  }

  const nearest = screen.getDisplayNearestPoint({ x: x + width / 2, y: y + height / 2 });
  const wa = nearest.workArea;
  if (x < wa.x) x = wa.x;
  if (y < wa.y) y = wa.y;
  if (x + width > wa.x + wa.width) x = wa.x + wa.width - width;
  if (y + height > wa.y + wa.height) y = wa.y + wa.height - height;

  return { width, height, x, y };
}

function saveWindowState(win, lastNormalBounds) {
  if (!win || win.isDestroyed()) return;
  try {
    const dir = path.dirname(windowStatePath());
    fs.mkdirSync(dir, { recursive: true });

    let payload;
    if (win.isMaximized()) {
      const b = lastNormalBounds || win.getBounds();
      payload = {
        isMaximized: true,
        width: b.width,
        height: b.height,
        x: b.x,
        y: b.y,
      };
    } else {
      payload = {
        isMaximized: false,
        ...win.getBounds(),
      };
    }

    fs.writeFileSync(windowStatePath(), JSON.stringify(payload, null, 2));
  } catch (e) {
    console.warn('[ygo] saveWindowState failed:', e.message);
  }
}

function attachWindowStatePersistence(win, initialNormalBounds) {
  let lastNormalBounds = initialNormalBounds || win.getBounds();

  const syncNormal = () => {
    if (win.isDestroyed()) return;
    if (!win.isMaximized()) {
      lastNormalBounds = win.getBounds();
    }
  };

  win.on('resize', syncNormal);
  win.on('move', syncNormal);
  win.on('unmaximize', syncNormal);

  win.on('close', () => {
    saveWindowState(win, lastNormalBounds);
  });
}

module.exports = {
  loadWindowState,
  constrainBounds,
  attachWindowStatePersistence,
  DEFAULT_BOUNDS,
};
