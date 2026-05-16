export const CARD_TYPES = [
  { value: 'monster', label: '怪兽卡' },
  { value: 'spell', label: '魔法卡' },
  { value: 'trap', label: '陷阱卡' },
]

export const ATTRIBUTES = [
  { value: 'dark', label: '暗' },
  { value: 'divine', label: '神' },
  { value: 'earth', label: '地' },
  { value: 'fire', label: '炎' },
  { value: 'light', label: '光' },
  { value: 'water', label: '水' },
  { value: 'wind', label: '风' },
]

/** 怪兽类别（名称下方「种族／类别」） */
export const MONSTER_CATEGORIES = [
  { value: 'normal', label: '通常' },
  { value: 'effect', label: '效果' },
  { value: 'ritual', label: '仪式' },
  { value: 'fusion', label: '融合' },
  { value: 'synchro', label: '同调' },
  { value: 'xyz', label: '超量' },
  { value: 'pendulum', label: '灵摆' },
  { value: 'link', label: '连接' },
]

/** 魔法卡的种类标识（对应卡图上方的类型说明） */
export const SPELL_CARD_TYPES = [
  { value: 'normal', label: '通常魔法' },
  { value: 'continuous', label: '永续魔法' },
  { value: 'equip', label: '装备魔法' },
  { value: 'quickplay', label: '速攻魔法' },
  { value: 'field', label: '场地魔法' },
  { value: 'ritual', label: '仪式魔法' },
]

/** 陷阱卡的种类标识 */
export const TRAP_CARD_TYPES = [
  { value: 'normal', label: '通常陷阱' },
  { value: 'continuous', label: '永续陷阱' },
  { value: 'counter', label: '反击陷阱' },
]

export const RACES = [
  '战士族', '魔法师族', '龙族', '恶魔族', '不死族', '机械族',
  '水族', '炎族', '鸟兽族', '植物族', '昆虫族', '雷族',
  '岩石族', '兽族', '兽战士族', '恐龙族', '鱼族', '海龙族',
  '爬虫类族', '念动力族', '天使族', '邪魔族', '幻神兽族', '创造神族',
]

export const DEFAULT_CARD = {
  name: '',
  password: '',
  cardType: 'monster',
  /** 与预览一致：默认地属性、3 星、兽族效果怪兽（可清空以隐藏对应卡图元素） */
  attribute: 'earth',
  level: 3,
  race: '兽族',
  monsterCategory: 'effect',
  spellType: 'normal',
  trapType: 'normal',
  attack: 0,
  defense: 0,
  attackInfinite: false,
  defenseInfinite: false,
  linkRating: 1,
  effect: '',
  description: '',
  /** 画布使用的地址：file URL / https URL / data URL */
  imagePath: '',
  /** 副标题展示用：本地绝对路径或在线 URL（不用于绘制） */
  imageDisplayPath: '',
}

export const ATTRIBUTE_COLORS = {
  dark: '#6b21a8',
  divine: '#ca8a04',
  earth: '#92400e',
  fire: '#dc2626',
  light: '#eab308',
  water: '#2563eb',
  wind: '#16a34a',
}

/**
 * 等级：null 表示不显示星级；数字限制在 1～12
 * @param {unknown} v
 * @returns {number | null}
 */
function normalizeLevelValue(v) {
  if (v === null || v === undefined || v === '') {
    return null
  }
  const n = Number(v)
  if (!Number.isFinite(n)) {
    return null
  }
  return Math.min(12, Math.max(1, n))
}

/**
 * 攻防数值：null 表示未填写，预览不绘制该项；0 为合法显示值。
 * @param {unknown} v
 * @returns {number | null}
 */
function normalizeOptionalStat(v) {
  if (v === null || v === undefined || v === '') {
    return null
  }
  const n = Number(v)
  if (!Number.isFinite(n)) {
    return null
  }
  return Math.min(9999, Math.max(0, Math.floor(n)))
}

/**
 * 兼容旧存档字段，保证预览与表单一致。
 * 等级为 null 时不绘制星级；怪兽类别可为空字符串。
 * @param {Record<string, unknown>} raw
 */
export function normalizeCard(raw) {
  const base = { ...DEFAULT_CARD, ...raw }
  const cardType = base.cardType || 'monster'
  const attackInfinite = Boolean(base.attackInfinite)
  const defenseInfinite = Boolean(base.defenseInfinite)
  const levelNorm = normalizeLevelValue(base.level)
  const mcRaw = base.monsterCategory
  const monsterCategory =
    mcRaw === null || mcRaw === undefined || String(mcRaw).trim() === ''
      ? ''
      : String(mcRaw)

  const attrRaw = String(base.attribute ?? '').trim().toLowerCase()
  const raceRaw = String(base.race ?? '').trim()

  return {
    ...base,
    cardType,
    attribute: attrRaw,
    race: raceRaw,
    level: levelNorm,
    attack: normalizeOptionalStat(base.attack),
    defense: normalizeOptionalStat(base.defense),
    attackInfinite,
    defenseInfinite,
    monsterCategory,
    linkRating: Math.min(8, Math.max(1, Number(base.linkRating) || 1)),
    spellType: base.spellType || 'normal',
    trapType: base.trapType || 'normal',
    name: String(base.name ?? '').slice(0, 120),
    password: String(base.password ?? '')
      .replace(/\D/g, '')
      .slice(0, 8),
    effect: String(base.effect ?? '').slice(0, 4500),
    imagePath: String(base.imagePath ?? '').trim().slice(0, 4096),
    imageDisplayPath: String(base.imageDisplayPath ?? '').trim().slice(0, 4096),
  }
}

export function labelFromOptions(options, value) {
  const row = options.find((o) => o.value === value)
  return row ? row.label : value
}
