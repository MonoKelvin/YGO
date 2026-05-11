/** 本地库统计摘要（主进程 / 服务共用） */
function buildYgoSummary(cards) {
  const byType = {};
  const byAttribute = {};
  const byFrame = {};
  for (const c of cards) {
    const t = c.type || 'Unknown';
    byType[t] = (byType[t] || 0) + 1;
    if (c.attribute) {
      byAttribute[c.attribute] = (byAttribute[c.attribute] || 0) + 1;
    }
    const f = c.frameType || 'unknown';
    byFrame[f] = (byFrame[f] || 0) + 1;
  }
  return { total: cards.length, byType, byAttribute, byFrame };
}

module.exports = { buildYgoSummary };
