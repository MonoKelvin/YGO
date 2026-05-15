import mdEncyclopedia from '../../assets/docs/rules/00-encyclopedia-intro.zh.md?raw'
import mdBeginner from '../../assets/docs/rules/01-beginner.zh.md?raw'
import mdCore from '../../assets/docs/rules/02-core.zh.md?raw'
import mdAdvanced from '../../assets/docs/rules/03-advanced.zh.md?raw'
import mdDetailed from '../../assets/docs/rules/04-detailed.zh.md?raw'

/**
 * 滚动对齐顶部偏移量（考虑固定标题栏高度）
 */
export const RULES_WIKI_SCROLL_ALIGN_TOP = 20

/**
 * 回到顶部按钮显示阈值
 */
export const SCROLL_TOP_BTN_SHOW_PX = 200

/**
 * 规则章节配置
 */
export const RULE_SECTIONS_RAW = [
  {
    id: 'part-encyclopedia',
    title: '百科引言',
    subtitle: 'IP、资料站与外链索引',
    md: mdEncyclopedia,
  },
  {
    id: 'part-beginner',
    title: '入门',
    subtitle: '先读这段就能开局',
    md: mdBeginner,
  },
  {
    id: 'part-core',
    title: '基础',
    subtitle: '卡组、区域与胜负',
    md: mdCore,
  },
  {
    id: 'part-advanced',
    title: '进阶',
    subtitle: '回合、召唤、战斗与连锁入门',
    md: mdAdvanced,
  },
  {
    id: 'part-detailed',
    title: '深入',
    subtitle: '大师规则与竞技提示',
    md: mdDetailed,
  },
]
