import type { Locale } from '../i18n/translations';

export interface CalendarDay {
  date: Date;
  dayKey: string; // 'YYYY-MM-DD'
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateMs: number;
}

export function formatDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 生成某月的 6×7=42 格日历网格。
 * @param year   年（如 2026）
 * @param month  月，0-based（如 2 = 3月）
 * @param weekStart 0=周日开头, 1=周一开头
 * @param todayMs 注入"现在"时间戳，便于测试与确定性
 */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStart: 0 | 1,
  todayMs: number,
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offset = (firstWeekday - weekStart + 7) % 7;
  const start = new Date(year, month, 1 - offset);
  const todayKey = formatDayKey(new Date(todayMs));

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dayKey = formatDayKey(d);
    days.push({
      date: d,
      dayKey,
      dayOfMonth: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: dayKey === todayKey,
      dateMs: d.getTime(),
    });
  }
  return days;
}

/** 周表头标签。locale 决定中文「一二三…」/ 英文单字母；weekStart 旋转起始日。 */
export function weekdayLabels(weekStart: 0 | 1, locale: Locale = 'zh'): string[] {
  const base =
    locale === 'zh'
      ? ['日', '一', '二', '三', '四', '五', '六'] // 索引 = getDay
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return [...base.slice(weekStart), ...base.slice(0, weekStart)];
}
