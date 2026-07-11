import type { Locale } from './translations';

/**
 * 内置分类中文名 → 英文显示名（含 classifyDomain 的 '其他' 兜底）。
 * 分类逻辑键保持中文（DB 聚合 / 启发式 / 过滤都用它），只在这里做显示层翻译。
 */
export const BUILTIN_CATEGORY_EN: Record<string, string> = {
  '社交': 'Social',
  '视频': 'Videos',
  '音乐': 'Music',
  '购物': 'Shopping',
  '生活': 'Lifestyle',
  '新闻': 'News',
  '邮件': 'Email',
  '搜索': 'Search',
  'AI': 'AI',
  '工作': 'Work',
  '开发': 'Dev',
  '学习': 'Learning',
  '参考': 'Reference',
  '金融': 'Finance',
  '旅行': 'Travel',
  '游戏': 'Games',
  '工具': 'Tools',
  '其他': 'Other',
};

/** 分类名按 locale 显示：中文键原样；英文查映射，用户自定义类不在表里则原样。 */
export function catLabel(name: string, locale: Locale): string {
  if (locale === 'zh') return name;
  return BUILTIN_CATEGORY_EN[name] ?? name;
}
