/**
 * API 的 type / attribute 需与 YGOProDeck 文档一致（英文枚举）
 * 界面展示中文标签
 */

export const YGO_TYPE_FILTERS = [
  { value: '', label: '全部类型' },
  { value: 'Normal Monster', label: '通常怪兽' },
  { value: 'Effect Monster', label: '效果怪兽' },
  { value: 'Ritual Monster', label: '仪式怪兽' },
  { value: 'Fusion Monster', label: '融合怪兽' },
  { value: 'Synchro Monster', label: '同调怪兽' },
  { value: 'XYZ Monster', label: '超量怪兽' },
  { value: 'Link Monster', label: '连接怪兽' },
  { value: 'Pendulum Normal Monster', label: '灵摆（通常）' },
  { value: 'Pendulum Effect Monster', label: '灵摆（效果）' },
  { value: 'Spell Card', label: '魔法卡' },
  { value: 'Trap Card', label: '陷阱卡' },
]

export const YGO_ATTRIBUTE_FILTERS = [
  { value: '', label: '全部属性' },
  { value: 'DARK', label: '暗' },
  { value: 'DIVINE', label: '神' },
  { value: 'EARTH', label: '地' },
  { value: 'FIRE', label: '炎' },
  { value: 'LIGHT', label: '光' },
  { value: 'WATER', label: '水' },
  { value: 'WIND', label: '风' },
]
