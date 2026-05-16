'use strict';

/**
 * 根据 Electron app.getLocale() 返回编辑区右键菜单文案（与系统语言对齐）。
 * 未覆盖的语言回退英文。
 */

const STRINGS = {
  'zh-CN': {
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    pasteAndMatchStyle: '粘贴并匹配样式',
    delete: '删除',
    selectAll: '全选',
    copyLink: '复制链接地址',
  },
  'zh-TW': {
    undo: '復原',
    redo: '重做',
    cut: '剪下',
    copy: '複製',
    paste: '貼上',
    pasteAndMatchStyle: '貼上並符合樣式',
    delete: '刪除',
    selectAll: '全選',
    copyLink: '複製連結位址',
  },
  ja: {
    undo: '元に戻す',
    redo: 'やり直す',
    cut: '切り取り',
    copy: 'コピー',
    paste: '貼り付け',
    pasteAndMatchStyle: '形式を合わせて貼り付け',
    delete: '削除',
    selectAll: 'すべて選択',
    copyLink: 'リンクのアドレスをコピー',
  },
  en: {
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pasteAndMatchStyle: 'Paste and Match Style',
    delete: 'Delete',
    selectAll: 'Select All',
    copyLink: 'Copy Link Address',
  },
};

/**
 * @param {string} locale app.getLocale()，如 zh-CN、en-US、ja
 * @returns {typeof STRINGS['en']}
 */
function resolveStrings(locale) {
  const raw = String(locale || 'en').replace(/_/g, '-');
  const lower = raw.toLowerCase();

  if (lower.startsWith('zh')) {
    if (/tw|hk|mo/i.test(raw)) {
      return STRINGS['zh-TW'];
    }
    return STRINGS['zh-CN'];
  }
  if (lower.startsWith('ja')) {
    return STRINGS.ja;
  }
  return STRINGS.en;
}

/**
 * @param {import('electron').App} electronApp
 * @returns {string[]}
 */
function collectCandidateLocales(electronApp) {
  const locales = [];

  const pushLocale = (value) => {
    if (typeof value !== 'string') return;
    const v = value.trim();
    if (!v) return;
    locales.push(v);
  };

  try {
    pushLocale(electronApp.getLocale?.());
  } catch {
    /* ignore */
  }

  try {
    pushLocale(electronApp.getSystemLocale?.());
  } catch {
    /* ignore */
  }

  try {
    const preferred = electronApp.getPreferredSystemLanguages?.();
    if (Array.isArray(preferred)) {
      preferred.forEach(pushLocale);
    }
  } catch {
    /* ignore */
  }

  pushLocale(process.env.LC_ALL);
  pushLocale(process.env.LC_MESSAGES);
  pushLocale(process.env.LANG);

  return locales;
}

/**
 * @param {import('electron').App} electronApp
 */
function getContextMenuLabels(electronApp) {
  try {
    const locales = collectCandidateLocales(electronApp);
    const preferred = locales.find((locale) => locale.toLowerCase().startsWith('zh'));
    if (preferred) {
      return resolveStrings(preferred);
    }
    if (locales.length > 0) {
      return resolveStrings(locales[0]);
    }
    return STRINGS.en;
  } catch {
    return STRINGS.en;
  }
}

module.exports = { getContextMenuLabels, resolveStrings };
