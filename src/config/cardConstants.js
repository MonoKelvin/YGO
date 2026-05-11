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
  attribute: 'earth',
  level: 4,
  race: '',
  monsterCategory: 'effect',
  spellType: 'normal',
  trapType: 'normal',
  attack: 1000,
  defense: 1000,
  /** 画布与表单显示为 ∞，仍保留数值字段便于取消无限后恢复量级 */
  attackInfinite: false,
  defenseInfinite: false,
  /** 连接怪兽刻度（仅 monsterCategory 为 link 时使用） */
  linkRating: 1,
  effect: '',
  description: '',
  imagePath: '',
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
 * 兼容旧存档字段，保证预览与表单一致。
 * @param {Record<string, unknown>} raw
 */
export function normalizeCard(raw) {
  const base = { ...DEFAULT_CARD, ...raw }
  const cardType = base.cardType || 'monster'
  const attackInfinite = Boolean(base.attackInfinite)
  const defenseInfinite = Boolean(base.defenseInfinite)
  return {
    ...base,
    cardType,
    level: Math.min(12, Math.max(1, Number(base.level) || 1)),
    attack: Math.min(9999, Math.max(0, Number(base.attack) || 0)),
    defense: Math.min(9999, Math.max(0, Number(base.defense) || 0)),
    attackInfinite,
    defenseInfinite,
    monsterCategory: base.monsterCategory || 'effect',
    linkRating: Math.min(8, Math.max(1, Number(base.linkRating) || 1)),
    spellType: base.spellType || 'normal',
    trapType: base.trapType || 'normal',
    name: String(base.name ?? '').slice(0, 120),
    password: String(base.password ?? '')
      .replace(/\D/g, '')
      .slice(0, 8),
    effect: String(base.effect ?? '').slice(0, 4500),
  }
}

export function labelFromOptions(options, value) {
  const row = options.find((o) => o.value === value)
  return row ? row.label : value
}
