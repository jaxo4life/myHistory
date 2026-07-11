import { describe, it, expect } from 'vitest';
import { buildMonthGrid, weekdayLabels } from '../src/lib/calendar';
import { getDayKey } from '../src/lib/url-utils';

const TODAY = new Date(2026, 2, 15, 12).getTime(); // 2026-03-15

describe('buildMonthGrid', () => {
  it('生成 42 格（6×7）', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY);
    expect(grid).toHaveLength(42);
  });

  it('周一开头：第一格是 2026-02-23（周一）', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY);
    expect(grid[0].dayKey).toBe('2026-02-23');
    expect(grid[0].isCurrentMonth).toBe(false);
  });

  it('当月格子 isCurrentMonth=true，今天 isToday=true', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY);
    const today = grid.find((d) => d.dayKey === '2026-03-15');
    expect(today).toBeDefined();
    expect(today!.isToday).toBe(true);
    expect(today!.isCurrentMonth).toBe(true);
  });

  it('周日开头：3-1 本身是周日，第一格就是 2026-03-01', () => {
    const grid = buildMonthGrid(2026, 2, 0, TODAY);
    expect(grid[0].dayKey).toBe('2026-03-01');
  });

  it('所有 dayKey 与 date 自洽', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY);
    for (const cell of grid) {
      expect(cell.dayKey).toBe(getDayKey(cell.date.getTime()));
    }
  });
});

describe('weekdayLabels', () => {
  it('中文 周一开头：一二三四五六日', () => {
    expect(weekdayLabels(1, 'zh')).toEqual(['一', '二', '三', '四', '五', '六', '日']);
  });

  it('中文 周日开头：日一二三四五六', () => {
    expect(weekdayLabels(0, 'zh')).toEqual(['日', '一', '二', '三', '四', '五', '六']);
  });

  it('英文 周一开头：MTWTFSS', () => {
    expect(weekdayLabels(1, 'en')).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });

  it('英文 周日开头：SMTWTFS', () => {
    expect(weekdayLabels(0, 'en')).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });
});
