import { db } from './database';
import type { Visit, NewVisit } from '../types/visit';
import { classifyDomain, DEFAULT_CATEGORY_ICON, DEFAULT_CATEGORY_COLOR } from '../lib/categories';
import { getCategories } from '../store/settings';
import { getDayKey } from '../lib/url-utils';

/** 写入一条访问记录，返回自增 id。 */
export async function addVisit(visit: NewVisit): Promise<number> {
  return (await db.visits.add(visit as Visit)) as number;
}

/** 取某天的全部访问，按时间倒序（最新在前）。 */
export async function getByDayKey(dayKey: string): Promise<Visit[]> {
  const rows = await db.visits.where('dayKey').equals(dayKey).toArray();
  return rows.sort((a, b) => b.visitTime - a.visitTime);
}

/** 取 [start, end) 时间范围内，每个 dayKey 的记录数（日历点亮用）。 */
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

/** 跨全部历史搜索：关键词 + 域名/类别/标签/时间范围过滤，按访问时间倒序。 */
export async function searchVisits(opts: {
  query: string;
  domain?: string;
  category?: string;
  tag?: string;
  startDate?: number;
  endDate?: number;
}): Promise<Visit[]> {
  const q = opts.query.trim().toLowerCase();
  const d = opts.domain?.trim().toLowerCase() ?? '';
  let rows = await db.visits.toArray();
  if (q) {
    rows = rows.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.url.toLowerCase().includes(q) ||
        v.domain.toLowerCase().includes(q),
    );
  }
  if (d) {
    rows = rows.filter((v) => v.domain.toLowerCase().includes(d));
  }
  if (opts.category) {
    const rules = await getCategories();
    rows = rows.filter((v) => classifyDomain(v.domain, rules) === opts.category);
  }
  if (opts.tag) {
    rows = rows.filter((v) => (v.tags ?? []).includes(opts.tag!));
  }
  if (opts.startDate) rows = rows.filter((v) => v.visitTime >= opts.startDate!);
  if (opts.endDate) rows = rows.filter((v) => v.visitTime < opts.endDate!);
  return rows.sort((a, b) => b.visitTime - a.visitTime);
}

/** 统计访问次数最多的域名，返回 [{domain, count}] 按次数倒序，取 limit 条。 */
export async function getTopDomains(
  limit = 30,
): Promise<{ domain: string; count: number }[]> {
  const rows = await db.visits.toArray();
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.domain, (map.get(r.domain) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** 清空全部历史。 */
export async function clearAllVisits(): Promise<void> {
  await db.visits.clear();
}

/** 按域名删除所有记录。 */
export async function deleteByDomain(domain: string): Promise<void> {
  await db.visits.where('domain').equals(domain).delete();
}

/** 批量删除多条记录。 */
export async function deleteVisits(ids: number[]): Promise<void> {
  await db.visits.bulkDelete(ids);
}

/** 最近 days 天的每日访问数，按日期升序。 */
export async function getDailyCounts(
  days = 30,
): Promise<{ dayKey: string; count: number }[]> {
  const now = Date.now();
  const start = now - days * 24 * 60 * 60 * 1000;
  const rows = await db.visits.where('visitTime').between(start, now, true, false).toArray();
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.dayKey, (map.get(r.dayKey) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([dayKey, count]) => ({ dayKey, count }))
    .sort((a, b) => (a.dayKey < b.dayKey ? -1 : 1));
}

/** 按 0-23 小时的访问分布。 */
export async function getHourlyDistribution(): Promise<{ hour: number; count: number }[]> {
  const rows = await db.visits.toArray();
  const counts = new Array(24).fill(0);
  for (const r of rows) counts[new Date(r.visitTime).getHours()]++;
  return counts.map((count, hour) => ({ hour, count }));
}

/** 概览指标：总量/域名/今日/本周/日均/最忙时段。 */
export async function getOverview(): Promise<{
  total: number;
  domains: number;
  today: number;
  week: number;
  dailyAvg: number;
  peakHour: number;
}> {
  const rows = await db.visits.toArray();
  const total = rows.length;
  const domains = new Set(rows.map((r) => r.domain)).size;
  const todayKey = getDayKey(Date.now());
  const today = rows.filter((r) => r.dayKey === todayKey).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = rows.filter((r) => r.visitTime >= weekAgo).length;
  const days = new Set(rows.map((r) => r.dayKey)).size;
  const dailyAvg = days > 0 ? Math.round(total / days) : 0;
  const hours = new Array(24).fill(0);
  for (const r of rows) hours[new Date(r.visitTime).getHours()]++;
  const peakHour = total > 0 ? hours.indexOf(Math.max(...hours)) : -1;
  return { total, domains, today, week, dailyAvg, peakHour };
}

/** 按当前分类规则统计访问数，含 icon，按次数倒序。 */
export async function getCategoryCounts(): Promise<
  { category: string; count: number; icon: string }[]
> {
  const rules = await getCategories();
  const rows = await db.visits.toArray();
  const map = new Map<string, number>();
  for (const r of rows) {
    const c = classifyDomain(r.domain, rules);
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries]()
    .map(([category, count]) => {
      const def = rules.find((r) => r.name === category);
      return {
        category,
        count,
        icon: def?.icon ?? DEFAULT_CATEGORY_ICON,
        color: def?.color ?? DEFAULT_CATEGORY_COLOR,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** 更新某条记录的标签全集。 */
export async function updateVisitTags(id: number, tags: string[]): Promise<void> {
  await db.visits.update(id, { tags });
}

/** 聚合所有标签及其使用次数，按次数倒序。 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const rows = await db.visits.toArray();
  const map = new Map<string, number>();
  for (const r of rows) {
    for (const t of r.tags ?? []) {
      map.set(t, (map.get(t) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
