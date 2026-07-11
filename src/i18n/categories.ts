import type { Locale } from './translations';

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
  '加密': 'Crypto',
  '旅行': 'Travel',
  '游戏': 'Games',
  '工具': 'Tools',
  '本地': 'Local',
  '其他': 'Other',
};

export function catLabel(name: string, locale: Locale): string {
  if (locale === 'zh') return name;
  return BUILTIN_CATEGORY_EN[name] ?? name;
}
