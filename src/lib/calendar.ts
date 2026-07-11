import type { Locale } from '../i18n/translations';
import { getDayKey } from './url-utils';
import { ZH_WEEKDAY_NARROW, EN_WEEKDAY_NARROW } from './date-format';

export interface CalendarDay {
  date: Date;
  dayKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateMs: number;
}

export function buildMonthGrid(
  year: number,
  month: number,
  weekStart: 0 | 1,
  todayMs: number,
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const offset = (firstWeekday - weekStart + 7) % 7;
  const start = new Date(year, month, 1 - offset);
  const todayKey = getDayKey(todayMs);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dayKey = getDayKey(d.getTime());
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

export function weekdayLabels(weekStart: 0 | 1, locale: Locale = 'zh'): string[] {
  const base = locale === 'zh' ? ZH_WEEKDAY_NARROW : EN_WEEKDAY_NARROW;
  return [...base.slice(weekStart), ...base.slice(0, weekStart)];
}
