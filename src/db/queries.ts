import { db } from './database';
import type { Visit, NewVisit } from '../types/visit';

/** 写入一条访问记录，返回自增 id。 */
export async function addVisit(visit: NewVisit): Promise<number> {
  return (await db.visits.add(visit as Visit)) as number;
}

/** 取某天的全部访问，按时间倒序（最新在前）。 */
export async function getByDayKey(dayKey: string): Promise<Visit[]> {
  const rows = await db.visits.where('dayKey').equals(dayKey).toArray();
  return rows.sort((a, b) => b.visitTime - a.visitTime);
}

/**
 * 取 [start, end) 时间范围内，每个 dayKey 的记录数。
 * 用于日历点亮圆点（与可选热力色阶）。
 */
export async function getDayCountsInRange(
  startMs: number,
  endMs: number,
): Promise<Map<string, number>> {
  const rows = await db.visits.where('visitTime').between(startMs, endMs, true, false).toArray();
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.dayKey, (counts.get(r.dayKey) ?? 0) + 1);
  }
  return counts;
}

/** 按 id 删除一条记录。 */
export async function deleteVisit(id: number): Promise<void> {
  await db.visits.delete(id);
}
