import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { addVisit, getByDayKey, getDayCountsInRange, deleteVisit } from '../src/db/queries';
import type { NewVisit } from '../src/types/visit';

async function seed(visits: NewVisit[]) {
  for (const v of visits) await addVisit(v);
}

function mkVisit(dayKey: string, visitTime: number, title: string): NewVisit {
  return {
    url: 'https://x.com',
    domain: 'x.com',
    title,
    visitTime,
    dayKey,
    transitionType: 'link',
  };
}

describe('visits 查询', () => {
  beforeEach(async () => {
    await db.visits.clear();
  });

  it('addVisit 写入并返回 id', async () => {
    const id = await addVisit(mkVisit('2026-03-15', new Date(2026, 2, 15, 10).getTime(), 'A'));
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('getByDayKey 返回该天记录并按时间倒序', async () => {
    await seed([
      mkVisit('2026-03-15', new Date(2026, 2, 15, 9).getTime(), 'early'),
      mkVisit('2026-03-15', new Date(2026, 2, 15, 18).getTime(), 'late'),
      mkVisit('2026-03-16', new Date(2026, 2, 16, 9).getTime(), 'other'),
    ]);
    const rows = await getByDayKey('2026-03-15');
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe('late');
    expect(rows[1].title).toBe('early');
  });

  it('getDayCountsInRange 返回范围内每天的计数', async () => {
    await seed([
      mkVisit('2026-03-15', new Date(2026, 2, 15, 9).getTime(), 'x'),
      mkVisit('2026-03-15', new Date(2026, 2, 15, 10).getTime(), 'x'),
      mkVisit('2026-03-16', new Date(2026, 2, 16, 9).getTime(), 'y'),
    ]);
    const start = new Date(2026, 2, 1).getTime();
    const end = new Date(2026, 3, 1).getTime();
    const counts = await getDayCountsInRange(start, end);
    expect(counts.get('2026-03-15')).toBe(2);
    expect(counts.get('2026-03-16')).toBe(1);
    expect(counts.get('2026-03-17')).toBeUndefined();
  });

  it('deleteVisit 按 id 删除', async () => {
    const id = await addVisit(mkVisit('2026-03-15', Date.now(), 't'));
    await deleteVisit(id);
    expect(await db.visits.get(id)).toBeUndefined();
  });
});
