import { useLiveQuery } from 'dexie-react-hooks';
import { getByDayKey } from '../db/queries';

/** 左栏日历下方的「当日概览」：当天访问数 + 最常去域名。 */
export function DaySummary({ dayKey }: { dayKey: string }) {
  const visits = useLiveQuery(() => getByDayKey(dayKey), [dayKey]);

  if (visits === undefined) return null;

  if (visits.length === 0) {
    return (
      <div className="rounded-xl bg-card p-3 text-xs text-muted">当天无浏览记录</div>
    );
  }

  const domainCount = new Map<string, number>();
  for (const v of visits) {
    domainCount.set(v.domain, (domainCount.get(v.domain) ?? 0) + 1);
  }
  const top = [...domainCount.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="rounded-xl bg-card p-3">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-fg">{visits.length}</span>
        <span className="text-xs text-muted">条访问</span>
      </div>
      <div className="mt-1 truncate text-xs text-muted" title={top[0]}>
        最常去 <span className="text-fg">{top[0]}</span> · {top[1]} 次
      </div>
    </div>
  );
}
