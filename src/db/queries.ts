import { db } from './database';
import type { Visit, NewVisit } from '../types/visit';
import { classifyDomain, DEFAULT_CATEGORY_ICON, DEFAULT_CATEGORY_COLOR } from '../lib/categories';
import { getCategories } from '../store/settings';
import { todayKey } from '../lib/url-utils';

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
): Promise<Record<string, number>> {
  const rows = await db.visits.where('visitTime').between(startMs, endMs, true, false).toArray();
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.dayKey] = (counts[r.dayKey] ?? 0) + 1;
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
  const rules = opts.category ? await getCategories() : null;
  const rows = await db.visits.toArray();
  const filtered = rows.filter((v) => {
    if (q) {
      const hay = v.title.toLowerCase();
      if (!hay.includes(q) && !v.url.toLowerCase().includes(q) && !v.domain.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (d && !v.domain.toLowerCase().includes(d)) return false;
    if (opts.category && rules && classifyDomain(v.domain, rules) !== opts.category) return false;
    if (opts.tag && !(v.tags ?? []).includes(opts.tag)) return false;
    if (opts.startDate && v.visitTime < opts.startDate) return false;
    if (opts.endDate && v.visitTime >= opts.endDate) return false;
    return true;
  });
  return filtered.sort((a, b) => b.visitTime - a.visitTime);
}

/** 统计访问次数最多的域名，返回 [{domain, count}] 按次数倒序；limit 不传则返回全部。 */
export async function getTopDomains(
  limit = Infinity,
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

/** 取全部访问记录（导出全部用）。 */
export async function getAllVisits(): Promise<Visit[]> {
  return db.visits.toArray();
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

/** 概览指标：总量/域名/今日/本周/日均/最忙时段/最早记录。 */
export async function getOverview(): Promise<{
  total: number;
  domains: number;
  today: number;
  week: number;
  dailyAvg: number;
  peakHour: number;
  earliest: number;
  latest: number;
}> {
  const rows = await db.visits.toArray();
  const total = rows.length;
  const tk = todayKey();
  const weekAgo = Date.now() - 7 * 86_400_000;
  const domainSet = new Set<string>();
  const daySet = new Set<string>();
  const hours = new Array(24).fill(0);
  let today = 0;
  let week = 0;
  let earliest = Infinity;
  let latest = 0;
  for (const r of rows) {
    domainSet.add(r.domain);
    daySet.add(r.dayKey);
    if (r.dayKey === tk) today++;
    if (r.visitTime >= weekAgo) week++;
    hours[new Date(r.visitTime).getHours()]++;
    if (r.visitTime < earliest) earliest = r.visitTime;
    if (r.visitTime > latest) latest = r.visitTime;
  }
  const dailyAvg = daySet.size > 0 ? Math.round(total / daySet.size) : 0;
  const peakHour = total > 0 ? hours.indexOf(Math.max(...hours)) : -1;
  return {
    total,
    domains: domainSet.size,
    today,
    week,
    dailyAvg,
    peakHour,
    earliest: total > 0 ? earliest : 0,
    latest,
  };
}

/** 按当前分类规则统计访问数，含 icon/color，按次数倒序。 */
export async function getCategoryCounts(): Promise<
  { category: string; count: number; icon: string; color: string }[]
> {
  const rules = await getCategories();
  const rows = await db.visits.toArray();
  const map = new Map<string, number>();
  for (const r of rows) {
    const c = classifyDomain(r.domain, rules);
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries()]
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

/** 一周(0=周日..6=周六) × 24小时 的访问计数矩阵（热力图用）。 */
export async function getWeekdayHourMatrix(): Promise<number[][]> {
  const rows = await db.visits.toArray();
  const matrix: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const r of rows) {
    const d = new Date(r.visitTime);
    matrix[d.getDay()][d.getHours()]++;
  }
  return matrix;
}

/** 访问来源(transitionType) 分布，按次数倒序。 */
export async function getTransitionCounts(): Promise<{ type: string; count: number }[]> {
  const rows = await db.visits.toArray();
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.transitionType, (map.get(r.transitionType) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
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
