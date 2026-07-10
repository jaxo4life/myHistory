import { describe, it, expect } from 'vitest';
import { buildMonthGrid, formatDayKey } from '../src/lib/calendar';

const TODAY = new Date(2026, 2, 15, 12).getTime(); // 2026-03-15

describe('formatDayKey', () => {
  it('把 Date 转 YYYY-MM-DD', () => {
    expect(formatDayKey(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

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
      expect(cell.dayKey).toBe(formatDayKey(cell.date));
    }
  });
});
