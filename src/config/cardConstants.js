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

export const RACES = [
  '战士族', '魔法师族', '龙族', '恶魔族', '不死族', '机械族',
  '水族', '炎族', '鸟兽族', '植物族', '昆虫族', '雷族',
  '岩石族', '兽族', '兽战士族', '恐龙族', '鱼族', '海龙族',
  '爬虫类族', '念动力族', '天使族', '邪魔族', '幻神兽族', '创造神族'
]

export const DEFAULT_CARD = {
  name: '',
  password: '',
  cardType: 'monster',
  attribute: 'earth',
  level: 4,
  race: '',
  attack: 1000,
  defense: 1000,
  effect: '',
  description: '',
  imagePath: '',
}

export const ATTRIBUTE_COLORS = {
  dark: '#8B5CF6',
  divine: '#FFD700',
  earth: '#D2691E',
  fire: '#EF4444',
  light: '#FACC15',
  water: '#3B82F6',
  wind: '#22C55E',
}
