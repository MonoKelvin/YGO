const path = require('path');
const { getEffectiveDataRoot } = require('./dataRoot.cjs');

function settingsFile() {
  return path.join(getEffectiveDataRoot(), 'settings.json');
}

/** 与 settings.json 同目录，仅主进程读写 */
function windowStateFile() {
  return path.join(getEffectiveDataRoot(), 'window-state.json');
}

function diyCardsFile() {
  return path.join(getEffectiveDataRoot(), 'cards.json');
}

function decksFile() {
  return path.join(getEffectiveDataRoot(), 'ygo-decks.json');
}

function ygoDataDir() {
  return path.join(getEffectiveDataRoot(), 'ygo-data');
}

function legacyLibraryJson() {
  return path.join(ygoDataDir(), 'cards.json');
}

function summaryJsonFile() {
  return path.join(ygoDataDir(), 'summary.json');
}

function sqliteLibraryFile() {
  return path.join(ygoDataDir(), 'library.sqlite');
}

module.exports = {
  settingsFile,
  windowStateFile,
  diyCardsFile,
  decksFile,
  ygoDataDir,
  legacyLibraryJson,
  summaryJsonFile,
  sqliteLibraryFile,
};
