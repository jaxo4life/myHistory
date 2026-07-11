import type { Locale } from '../i18n/translations';

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const EN_MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
// 索引 = Date.getDay()（0=周日）
const ZH_WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const EN_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// 窄格式（日历表头 / 热力图行标签），索引 = Date.getDay()
export const ZH_WEEKDAY_NARROW = ['日', '一', '二', '三', '四', '五', '六'];
export const EN_WEEKDAY_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** 周起始：中文周一(1) / 英文周日(0)。 */
export function weekStartForLocale(locale: Locale): 0 | 1 {
  return locale === 'zh' ? 1 : 0;
}

/** 周几名：zh 周一…周日 / en Mon…Sun。getDay 为 Date.getDay()（0=周日）。 */
export function weekdayName(getDay: number, locale: Locale): string {
  return locale === 'zh' ? ZH_WEEK[getDay] : EN_WEEK[getDay];
}

/** 月份大标题：zh「2026年7月」/ en「July 2026」。month 为 0-11。 */
export function formatMonthTitle(year: number, month: number, locale: Locale): string {
  return locale === 'zh' ? `${year}年${month + 1}月` : `${EN_MONTHS[month]} ${year}`;
}

/** 月份选择器缩写：zh「7月」/ en「Jul」。month 为 0-11。 */
export function formatMonthAbbr(month: number, locale: Locale): string {
  return locale === 'zh' ? `${month + 1}月` : EN_MONTH_ABBR[month];
}

/** 给人读的长日期：zh「2026年7月10日」/ en「Jul 10, 2026」。 */
export function formatDateLong(ms: number, locale: Locale): string {
  const d = new Date(ms);
  return locale === 'zh'
    ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    : `${EN_MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** 历史列表分组标题的日期部分（含周几）：zh「7月10日 · 周四」/ en「Jul 10 Thu」。 */
export function formatDateGroupBody(dayKey: string, locale: Locale): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return locale === 'zh'
    ? `${m}月${d}日 · ${weekdayName(date.getDay(), locale)}`
    : `${EN_MONTH_ABBR[m - 1]} ${d} ${weekdayName(date.getDay(), locale)}`;
}
