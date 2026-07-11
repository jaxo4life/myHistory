import { describe, it, expect } from 'vitest';
import {
  formatMonthTitle,
  formatMonthAbbr,
  formatDateLong,
  formatDateGroupBody,
  weekdayName,
} from '../src/lib/date-format';

// 2026-01-01 是周四（getDay=4）
const MS = new Date(2026, 0, 1).getTime();

describe('formatMonthTitle', () => {
  it('zh: 2026年1月', () => expect(formatMonthTitle(2026, 0, 'zh')).toBe('2026年1月'));
  it('en: January 2026', () => expect(formatMonthTitle(2026, 0, 'en')).toBe('January 2026'));
});

describe('formatMonthAbbr', () => {
  it('zh: 1月', () => expect(formatMonthAbbr(0, 'zh')).toBe('1月'));
  it('en: Jan', () => expect(formatMonthAbbr(0, 'en')).toBe('Jan'));
});

describe('formatDateLong', () => {
  it('zh: 2026年1月1日', () => expect(formatDateLong(MS, 'zh')).toBe('2026年1月1日'));
  it('en: Jan 1, 2026', () => expect(formatDateLong(MS, 'en')).toBe('Jan 1, 2026'));
});

describe('formatDateGroupBody', () => {
  it('zh: 1月1日 · 周四', () =>
    expect(formatDateGroupBody('2026-01-01', 'zh')).toBe('1月1日 · 周四'));
  it('en: Jan 1 Thu', () =>
    expect(formatDateGroupBody('2026-01-01', 'en')).toBe('Jan 1 Thu'));
});

describe('weekdayName', () => {
  it('zh getDay=4: 周四', () => expect(weekdayName(4, 'zh')).toBe('周四'));
  it('en getDay=4: Thu', () => expect(weekdayName(4, 'en')).toBe('Thu'));
});
