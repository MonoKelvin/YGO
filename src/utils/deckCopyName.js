/**
 * 复制卡组时生成「原名称（n）」；n 从 1 递增，跳过已占用名称。
 * @param {string} sourceName
 * @param {{ name?: string }[]} decks
 */
export function nextDeckCopyName(sourceName, decks) {
  const base = String(sourceName || '').trim() || '未命名卡组'
  const taken = new Set(
    (decks || []).map((d) => String(d.name || '').trim()),
  )
  let n = 1
  while (taken.has(`${base}（${n}）`)) n += 1
  return `${base}（${n}）`
}
