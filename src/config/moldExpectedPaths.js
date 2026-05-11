/**
 * 用于「素材自检」的路径清单（实际文件名可为 .png / .jpg / .jpeg / .webp）。
 * 魔法/陷阱图标可在 Icon 或 Attribute/cn 下（见 moldAssets 解析顺序）。
 */
export const MOLD_EXPECTED_PATHS = {
  attributeCn: [
    'Attribute/cn/dark.png',
    'Attribute/cn/divine.png',
    'Attribute/cn/earth.png',
    'Attribute/cn/fire.png',
    'Attribute/cn/light.png',
    'Attribute/cn/water.png',
    'Attribute/cn/wind.png',
  ],
  /** 魔法卡图标：以下任一存在即可（脚本按「任一阵列命中」校验） */
  spellIconAnyOf: ['Icon/spell.png', 'Attribute/cn/spell.png'],
  trapIconAnyOf: ['Icon/trap.png', 'Attribute/cn/trap.png'],
  /** 边框：以下任一存在即可（怪兽框常有 monster_tt 等命名） */
  frameMonsterAnyOf: ['Frame/monster_tt.jpg', 'Frame/monster.jpg', 'Frame/monster.png'],
  frameSpellAnyOf: ['Frame/spell.jpg', 'Frame/spell.png', 'Frame/magic.jpg'],
  frameTrapAnyOf: ['Frame/trap.jpg', 'Frame/trap.png'],
}

/** @returns {string[]} 扁平列表（用于 listMissingMoldAssets 粗检） */
export function getAllExpectedMoldPaths() {
  const { attributeCn } = MOLD_EXPECTED_PATHS
  return [...attributeCn]
}
