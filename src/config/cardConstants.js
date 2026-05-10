export const CARD_CONSTANTS = {
  ASPECT_RATIO: 1185 / 813,
  DEFAULT_WIDTH: 813,
  DEFAULT_HEIGHT: 1185,
  PREVIEW_WIDTH: 325,
  PREVIEW_HEIGHT: 474,

  BASE_TYPES: [
    { value: 'monster', label: '怪兽' },
    { value: 'spell', label: '魔法' },
    { value: 'trap', label: '陷阱' }
  ],

  MONSTER_TYPES: [
    { value: 'normal', label: '通常' },
    { value: 'effect', label: '效果' },
    { value: 'ritual', label: '仪式' },
    { value: 'fusion', label: '融合' },
    { value: 'synchro', label: '同调' },
    { value: 'xyz', label: 'XYZ' },
    { value: 'pendulum', label: '灵摆' },
    { value: 'link', label: '连接' }
  ],

  SPELL_TYPES: [
    { value: 'normal', label: '通常' },
    { value: 'counter', label: '反击' },
    { value: 'continuous', label: '永续' },
    { value: 'equip', label: '装备' },
    { value: 'quick-play', label: '速攻' },
    { value: 'field', label: '场地' }
  ],

  TRAP_TYPES: [
    { value: 'normal', label: '通常' },
    { value: 'continuous', label: '永续' },
    { value: 'counter', label: '反击' }
  ],

  ATTRIBUTES: [
    { value: 'light', label: '光' },
    { value: 'dark', label: '暗' },
    { value: 'fire', label: '炎' },
    { value: 'water', label: '水' },
    { value: 'wind', label: '风' },
    { value: 'earth', label: '地' },
    { value: 'divine', label: '神' }
  ],

  RACES: [
    '龙族', '海龙族', '恐龙族', '爬虫族', '鱼族', '机械族', '水族', '植物族',
    '念动力族', '雷族', '昆虫族', '兽族', '兽战士族', '鸟兽族', '战士族',
    '魔法师族', '天使族', '不死族', '幻神兽族', '创造神族', '幻龙族',
    '彭萨族', '电子界族', '心意族', '代作族', '古代机械族', '芳香族'
  ],

  LINK_MARKERS: [
    { index: 0, label: '左上', direction: 'top-left' },
    { index: 1, label: '上', direction: 'top' },
    { index: 2, label: '右上', direction: 'top-right' },
    { index: 3, label: '左', direction: 'left' },
    { index: 4, label: '右', direction: 'right' },
    { index: 5, label: '左下', direction: 'bottom-left' },
    { index: 6, label: '下', direction: 'bottom' },
    { index: 7, label: '右下', direction: 'bottom-right' }
  ]
}

export const RENDER_CONFIG = {
  PICTURE: { X: 100, Y: 219, WIDTH: 614, HEIGHT: 616 },
  ATTRIBUTE: { X: 680, Y: 57, WIDTH: 66, HEIGHT: 66 },
  LEVEL: { X: 686, Y: 145, WIDTH: 50, HEIGHT: 50, DISTANCE: 55 },
  NAME: { X: 65, Y: 96, FONT_SIZE: 65, MAX_WIDTH: 610 },
  RACE: { X: 53, Y: 915, FONT_SIZE: 26, MAX_WIDTH: 610 },
  MONSTER_DESC: { X: 64, Y: 942, FONT_SIZE: 24, LINE_HEIGHT: 26, MAX_LINES: 6, MAX_WIDTH: 683 },
  SPELL_DESC: { X: 66, Y: 915, FONT_SIZE: 24, LINE_HEIGHT: 24, MAX_LINES: 9, MAX_WIDTH: 683 },
  ATTACK: { X: 585, Y: 1107, FONT_SIZE: 36, LABEL_X: 513, LABEL: 'ATK/' },
  DEFENSE: { X: 750, Y: 1107, FONT_SIZE: 36, LABEL_X: 678, LABEL: 'DEF/', LINK_LABEL: 'LINK-' },
  COPYRIGHT: { X: 730, Y: 1146, FONT_SIZE: 18 }
}
