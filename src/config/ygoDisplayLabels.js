import { YGO_ATTRIBUTE_FILTERS, YGO_TYPE_FILTERS } from './ygoprodeckFilters'

/** value → 中文（类型筛选） */
const TYPE_LABEL_MAP = Object.fromEntries(
  YGO_TYPE_FILTERS.filter((o) => o.value).map((o) => [o.value, o.label]),
)

/** 英文属性枚举 → 中文 */
const ATTR_LABEL_MAP = Object.fromEntries(
  YGO_ATTRIBUTE_FILTERS.filter((o) => o.value).map((o) => [o.value.toUpperCase(), o.label]),
)

/** 已是中文的怪兽属性（本地数据或已翻译） */
const CN_ATTRIBUTES = new Set(['暗', '神', '地', '炎', '光', '水', '风'])

/** 常见种族英文名 → 中文（YGOProDeck API） */
const RACE_LABEL_MAP = {
  'warrior': '战士族',
  'spellcaster': '魔法师族',
  'fairy': '天使族',
  'fiend': '恶魔族',
  'zombie': '不死族',
  'machine': '机械族',
  'aqua': '水族',
  'pyro': '炎族',
  'rock': '岩石族',
  'winged beast': '鸟兽族',
  'plant': '植物族',
  'insect': '昆虫族',
  'thunder': '雷族',
  'dragon': '龙族',
  'beast': '兽族',
  'beast-warrior': '兽战士族',
  'dinosaur': '恐龙族',
  'fish': '鱼族',
  'sea serpent': '海龙族',
  'reptile': '爬虫类族',
  'psychic': '念动力族',
  'divine-beast': '幻神兽族',
  'wyrm': '幻龙族',
  'cyberse': '电子界族',
  'illusion': '幻想魔族',
  'creator god': '创造神族',
}

/** 按关键词兜底匹配英文 type 字符串 */
const TYPE_PATTERN_RULES = [
  [/pendulum\s+normal\s+monster/i, '灵摆（通常）'],
  [/pendulum\s+effect\s+monster/i, '灵摆（效果）'],
  [/pendulum\s+fusion\s+monster/i, '灵摆·融合怪兽'],
  [/pendulum\s+.*monster/i, '灵摆怪兽'],
  [/link\s+monster/i, '连接怪兽'],
  [/xyz\s+monster/i, '超量怪兽'],
  [/x-?yz\s+monster/i, '超量怪兽'],
  [/synchro\s+monster/i, '同调怪兽'],
  [/fusion\s+monster/i, '融合怪兽'],
  [/ritual\s+effect\s+monster/i, '仪式·效果怪兽'],
  [/ritual\s+monster/i, '仪式怪兽'],
  [/normal\s+tuner\s+monster/i, '调整·通常怪兽'],
  [/tuner\s+monster/i, '调整怪兽'],
  [/normal\s+monster/i, '通常怪兽'],
  [/effect\s+monster/i, '效果怪兽'],
  [/spell\s+card/i, '魔法卡'],
  [/trap\s+card/i, '陷阱卡'],
  [/monster/i, '怪兽'],
]

/**
 * 卡牌类型（英文 API / 本地 JSON）→ 界面中文
 * @param {unknown} type
 */
export function formatYgoCardType(type) {
  const raw = String(type ?? '').trim()
  if (!raw) return '—'

  if (TYPE_LABEL_MAP[raw]) {
    return TYPE_LABEL_MAP[raw]
  }

  const exactCi = YGO_TYPE_FILTERS.find(
    (o) => o.value && o.value.toLowerCase() === raw.toLowerCase(),
  )
  if (exactCi) {
    return exactCi.label
  }

  for (const [re, label] of TYPE_PATTERN_RULES) {
    if (re.test(raw)) {
      return label
    }
  }

  if (/[\u4e00-\u9fff]/.test(raw)) {
    return raw
  }

  return raw
}

/**
 * 怪兽属性（DARK / 暗 等）→ 中文
 * @param {unknown} attribute
 */
export function formatYgoAttribute(attribute) {
  const raw = String(attribute ?? '').trim()
  if (!raw) return '—'

  if (CN_ATTRIBUTES.has(raw)) {
    return raw
  }

  const upper = raw.toUpperCase()
  if (ATTR_LABEL_MAP[upper]) {
    return ATTR_LABEL_MAP[upper]
  }

  if (/[\u4e00-\u9fff]/.test(raw)) {
    return raw
  }

  return raw
}

/**
 * 种族 → 中文（详情标签等）
 * @param {unknown} race
 */
export function formatYgoRace(race) {
  const raw = String(race ?? '').trim()
  if (!raw) return ''

  if (/[\u4e00-\u9fff]/.test(raw)) {
    return raw
  }

  const key = raw.toLowerCase()
  if (RACE_LABEL_MAP[key]) {
    return RACE_LABEL_MAP[key]
  }

  return raw
}
