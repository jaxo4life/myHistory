import { db } from './database';
import type { Visit, NewVisit } from '../types/visit';
import { classifyDomain, DEFAULT_CATEGORY_ICON, DEFAULT_CATEGORY_COLOR, type CategoryDef } from '../lib/categories';
import { getCategories } from '../store/settings';
import { todayKey } from '../lib/url-utils';

export async function addVisit(visit: NewVisit): Promise<number> {
  return (await db.visits.add(visit as Visit)) as number;
}

export async function getByDayKey(dayKey: string): Promise<Visit[]> {
  const rows = await db.visits.where('dayKey').equals(dayKey).toArray();
  return rows.sort((a, b) => b.visitTime - a.visitTime);
}

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

export async function getDayCountsFiltered(opts: {
  startMs: number;
  endMs: number;
  query?: string;
  domain?: string;
  category?: string;
  tag?: string;
}): Promise<Record<string, number>> {
  const f: VisitFilter = {
    q: opts.query?.trim().toLowerCase() ?? '',
    d: opts.domain?.trim().toLowerCase() ?? '',
    category: opts.category,
    rules: opts.category ? await getCategories() : null,
    tag: opts.tag,
  };
  const rows = await db.visits.where('visitTime').between(opts.startMs, opts.endMs, true, false).toArray();
  const counts: Record<string, number> = {};
  for (const v of rows) {
    if (!matchVisit(v, f)) continue;
    counts[v.dayKey] = (counts[v.dayKey] ?? 0) + 1;
  }
  return counts;
}

export async function deleteVisit(id: number): Promise<void> {
  await db.visits.delete(id);
}

interface VisitFilter {
  q: string;
  d: string;
  category?: string;
  rules: CategoryDef[] | null;
  tag?: string;
}

function matchVisit(v: Visit, f: VisitFilter): boolean {
  if (f.q) {
    const hay = v.title.toLowerCase();
    if (!hay.includes(f.q) && !v.url.toLowerCase().includes(f.q) && !v.domain.toLowerCase().includes(f.q)) {
      return false;
    }
  }
  if (f.d && !v.domain.toLowerCase().includes(f.d)) return false;
  if (f.category && f.rules && classifyDomain(v.domain, f.rules) !== f.category) return false;
  if (f.tag && !(v.tags ?? []).includes(f.tag)) return false;
  return true;
}

export async function searchVisits(opts: {
  query: string;
  domain?: string;
  category?: string;
  tag?: string;
  startDate?: number;
  endDate?: number;
}): Promise<Visit[]> {
  const f: VisitFilter = {
    q: opts.query.trim().toLowerCase(),
    d: opts.domain?.trim().toLowerCase() ?? '',
    category: opts.category,
    rules: opts.category ? await getCategories() : null,
    tag: opts.tag,
  };
  const rows = await db.visits.toArray();
  const filtered = rows.filter((v) => {
    if (!matchVisit(v, f)) return false;
    if (opts.startDate && v.visitTime < opts.startDate) return false;
    if (opts.endDate && v.visitTime >= opts.endDate) return false;
    return true;
  });
  return filtered.sort((a, b) => b.visitTime - a.visitTime);
}

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

export async function clearAllVisits(): Promise<void> {
  await db.visits.clear();
}

export async function getAllVisits(): Promise<Visit[]> {
  return db.visits.toArray();
}

export async function deleteByDomain(domain: string): Promise<void> {
  await db.visits.where('domain').equals(domain).delete();
}

export async function deleteVisits(ids: number[]): Promise<void> {
  await db.visits.bulkDelete(ids);
}

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

export async function getHourlyDistribution(): Promise<{ hour: number; count: number }[]> {
  const rows = await db.visits.toArray();
  const counts = new Array(24).fill(0);
  for (const r of rows) counts[new Date(r.visitTime).getHours()]++;
  return counts.map((count, hour) => ({ hour, count }));
}

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

export async function getWeekdayHourMatrix(): Promise<number[][]> {
  const rows = await db.visits.toArray();
  const matrix: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const r of rows) {
    const d = new Date(r.visitTime);
    matrix[d.getDay()][d.getHours()]++;
  }
  return matrix;
}

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

export async function updateVisitTags(id: number, tags: string[]): Promise<void> {
  await db.visits.update(id, { tags });
}

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

export async function getTodayCount(): Promise<number> {
  return db.visits.where('dayKey').equals(todayKey()).count();
}

export async function getDomainCount(domain: string): Promise<number> {
  if (!domain) return 0;
  return db.visits.where('domain').equals(domain).count();
}

export async function getTodayTopCategory(
  rules: CategoryDef[],
): Promise<{ name: string; icon: string; color: string } | null> {
  const rows = await db.visits.where('dayKey').equals(todayKey()).toArray();
  if (rows.length === 0) return null;
  const map = new Map<string, number>();
  for (const r of rows) {
    const c = classifyDomain(r.domain, rules);
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  let bestName = '';
  let bestCount = 0;
  for (const [name, count] of map) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }
  const def = rules.find((r) => r.name === bestName);
  return {
    name: bestName,
    icon: def?.icon ?? DEFAULT_CATEGORY_ICON,
    color: def?.color ?? DEFAULT_CATEGORY_COLOR,
  };
}

export async function getDerivedMetrics(): Promise<{
  uniqueDomains: number;
  concentrationTop5: number;
  diversity: number;
  loyalty: number;
}> {
  const rows = await db.visits.toArray();
  const total = rows.length;
  if (total === 0) return { uniqueDomains: 0, concentrationTop5: 0, diversity: 0, loyalty: 0 };
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.domain, (map.get(r.domain) ?? 0) + 1);
  const counts = [...map.values()].sort((a, b) => b - a);
  const uniqueDomains = counts.length;
  const top5 = counts.slice(0, 5).reduce((s, c) => s + c, 0);
  const concentrationTop5 = top5 / total;
  let H = 0;
  for (const c of counts) {
    const p = c / total;
    H -= p * Math.log(p);
  }
  const diversity = uniqueDomains > 1 ? H / Math.log(uniqueDomains) : 0;
  const loyalDomains = counts.filter((c) => c >= 3).length;
  const loyalty = uniqueDomains > 0 ? loyalDomains / uniqueDomains : 0;
  return { uniqueDomains, concentrationTop5, diversity, loyalty };
}

export async function getDiscoveryRate(days = 30): Promise<{
  newDomains: number;
  totalDomains: number;
  rate: number;
}> {
  const cutoff = Date.now() - days * 86_400_000;
  const rows = await db.visits.toArray();
  const firstSeen = new Map<string, number>();
  for (const r of rows) {
    const prev = firstSeen.get(r.domain);
    if (prev === undefined || r.visitTime < prev) firstSeen.set(r.domain, r.visitTime);
  }
  const totalDomains = firstSeen.size;
  let newDomains = 0;
  for (const t of firstSeen.values()) if (t >= cutoff) newDomains++;
  return { newDomains, totalDomains, rate: totalDomains ? newDomains / totalDomains : 0 };
}

export async function getCompare(period: 'week' | 'month'): Promise<{
  current: number;
  previous: number;
  change: number;
}> {
  const span = period === 'week' ? 7 : 30;
  const now = Date.now();
  const curStart = now - span * 86_400_000;
  const prevStart = now - 2 * span * 86_400_000;
  const rows = await db.visits.where('visitTime').between(prevStart, now, true, false).toArray();
  let current = 0;
  let previous = 0;
  for (const r of rows) {
    if (r.visitTime >= curStart) current++;
    else previous++;
  }
  const change = previous ? (current - previous) / previous : current > 0 ? 1 : 0;
  return { current, previous, change };
}

export async function getCategoryTrend(days = 30): Promise<{
  categories: string[];
  points: Array<Record<string, number | string>>;
}> {
  const rules = await getCategories();
  const start = Date.now() - days * 86_400_000;
  const rows = await db.visits.where('visitTime').between(start, Date.now(), true, false).toArray();
  const byDay = new Map<string, Map<string, number>>();
  const catSet = new Set<string>();
  for (const r of rows) {
    const cat = classifyDomain(r.domain, rules);
    catSet.add(cat);
    if (!byDay.has(r.dayKey)) byDay.set(r.dayKey, new Map());
    const m = byDay.get(r.dayKey)!;
    m.set(cat, (m.get(cat) ?? 0) + 1);
  }
  const categories = [...catSet];
  const dayKeys = [...byDay.keys()].sort();
  const points = dayKeys.map((dk) => {
    const m = byDay.get(dk)!;
    const row: Record<string, number | string> = { dayKey: dk };
    for (const c of categories) row[c] = m.get(c) ?? 0;
    return row;
  });
  return { categories, points };
}

export async function getTagStats(): Promise<{
  uniqueTags: number;
  totalUses: number;
  top: { tag: string; count: number }[];
}> {
  const rows = await db.visits.toArray();
  const map = new Map<string, number>();
  for (const r of rows) for (const t of r.tags ?? []) map.set(t, (map.get(t) ?? 0) + 1);
  const top = [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  return { uniqueTags: map.size, totalUses: top.reduce((s, x) => s + x.count, 0), top };
}

export async function getSessionStats(gapMs = 30 * 60 * 1000): Promise<{
  sessions: number;
  avgLength: number;
  avgPerDay: number;
  longestSession: number;
  distractionIndex: number;
}> {
  const rows = (await db.visits.toArray()).sort((a, b) => a.visitTime - b.visitTime);
  if (rows.length === 0)
    return { sessions: 0, avgLength: 0, avgPerDay: 0, longestSession: 0, distractionIndex: 0 };
  const sess: { count: number; domains: Set<string> }[] = [];
  let count = 1;
  let domains = new Set<string>([rows[0].domain]);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].visitTime - rows[i - 1].visitTime > gapMs) {
      sess.push({ count, domains });
      count = 1;
      domains = new Set<string>([rows[i].domain]);
    } else {
      count++;
      domains.add(rows[i].domain);
    }
  }
  sess.push({ count, domains });
  const sessions = sess.length;
  const totalVisits = sess.reduce((s, x) => s + x.count, 0);
  const avgLength = totalVisits / sessions;
  const longestSession = Math.max(...sess.map((x) => x.count));
  const days = new Set(rows.map((r) => r.dayKey));
  const avgPerDay = days.size ? sessions / days.size : 0;
  const distractionIndex =
    sess.reduce((s, x) => s + (x.count > 0 ? x.domains.size / x.count : 0), 0) / sessions;
  return { sessions, avgLength, avgPerDay, longestSession, distractionIndex };
}

export async function getBehaviorProfile(): Promise<{
  activity: number;
  diversity: number;
  focus: number;
  discovery: number;
  regularity: number;
}> {
  const rows = await db.visits.toArray();
  const total = rows.length;
  if (total === 0) return { activity: 0, diversity: 0, focus: 0, discovery: 0, regularity: 0 };
  const days = new Set(rows.map((r) => r.dayKey));
  const dailyAvg = total / days.size;
  const activity = Math.min(100, Math.round(dailyAvg));
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.domain, (map.get(r.domain) ?? 0) + 1);
  const counts = [...map.values()];
  const unique = counts.length;
  let H = 0;
  for (const c of counts) {
    const p = c / total;
    H -= p * Math.log(p);
  }
  const diversity = Math.round((unique > 1 ? H / Math.log(unique) : 0) * 100);
  const top5 = [...counts].sort((a, b) => b - a).slice(0, 5).reduce((s, c) => s + c, 0);
  const focus = Math.round((top5 / total) * 100);
  const cutoff = Date.now() - 30 * 86_400_000;
  const firstSeen = new Map<string, number>();
  for (const r of rows) {
    const prev = firstSeen.get(r.domain);
    if (prev === undefined || r.visitTime < prev) firstSeen.set(r.domain, r.visitTime);
  }
  let newly = 0;
  for (const t of firstSeen.values()) if (t >= cutoff) newly++;
  const discovery = Math.round((firstSeen.size ? newly / firstSeen.size : 0) * 100);
  const perDay = new Map<string, number>();
  for (const r of rows) perDay.set(r.dayKey, (perDay.get(r.dayKey) ?? 0) + 1);
  const vals = [...perDay.values()];
  const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
  const variance = vals.reduce((s, x) => s + (x - mean) ** 2, 0) / vals.length;
  const cv = mean ? Math.sqrt(variance) / mean : 0;
  const regularity = Math.round(Math.max(0, 1 - Math.min(1, cv)) * 100);
  return { activity, diversity, focus, discovery, regularity };
}

export async function getWeekdayVsWeekend(): Promise<{
  weekday: { total: number; avg: number };
  weekend: { total: number; avg: number };
}> {
  const rows = await db.visits.toArray();
  const wd = { count: 0, days: new Set<string>() };
  const we = { count: 0, days: new Set<string>() };
  for (const r of rows) {
    const d = new Date(r.visitTime).getDay();
    const bucket = d === 0 || d === 6 ? we : wd;
    bucket.count++;
    bucket.days.add(r.dayKey);
  }
  return {
    weekday: { total: wd.count, avg: wd.days.size ? wd.count / wd.days.size : 0 },
    weekend: { total: we.count, avg: we.days.size ? we.count / we.days.size : 0 },
  };
}
