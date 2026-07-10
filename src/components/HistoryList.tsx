import { useEffect, useState } from 'react';
import type { Visit } from '../types/visit';
import { HistoryItem } from './HistoryItem';
import { getDayKey } from '../lib/url-utils';

const PAGE_SIZE = 100;
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 分组标题：今天 / 昨天 / X月X日 · 周X。 */
function dayLabel(dayKey: string, todayKey: string, yesterdayKey: string): string {
  if (dayKey === todayKey) return '今天';
  if (dayKey === yesterdayKey) return '昨天';
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}月${d}日 · ${WEEKDAYS[date.getDay()]}`;
}

interface Group {
  dayKey: string;
  label: string;
  items: Visit[];
}

/** 按天分组，保持 visits 原有时间倒序。 */
function groupByDay(visits: Visit[], todayKey: string, yesterdayKey: string): Group[] {
  const map = new Map<string, Visit[]>();
  for (const v of visits) {
    const k = getDayKey(v.visitTime);
    let arr = map.get(k);
    if (!arr) {
      arr = [];
      map.set(k, arr);
    }
    arr.push(v);
  }
  return [...map.entries()].map(([dayKey, items]) => ({
    dayKey,
    label: dayLabel(dayKey, todayKey, yesterdayKey),
    items,
  }));
}

interface ListProps {
  visits: Visit[] | undefined;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onTagClick?: (tag: string) => void;
}

export function HistoryList({
  visits,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onTagClick,
}: ListProps) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  // 列表数据变化时重置分页
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [visits]);

  if (visits === undefined) {
    return <div className="py-8 text-center text-sm text-muted">加载中…</div>;
  }
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-3 h-10 w-10 text-muted opacity-40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <div className="text-sm text-fg">没有匹配的浏览记录</div>
        <div className="mt-1 text-xs text-muted">试试调整搜索词或清除筛选</div>
      </div>
    );
  }

  const shown = visits.slice(0, limit);
  const todayKey = getDayKey(Date.now());
  const yesterdayKey = getDayKey(Date.now() - 86_400_000);
  const groups = groupByDay(shown, todayKey, yesterdayKey);
  const remaining = visits.length - limit;

  return (
    <div>
      {groups.map((g) => (
        <section key={g.dayKey}>
          <div className="sticky top-0 z-10 bg-bg/85 py-2 text-xs font-medium tracking-wide text-muted backdrop-blur-sm">
            {g.label}
          </div>
          <div className="divide-y divide-border/60">
            {g.items.map((v) => (
              <HistoryItem
                key={v.id}
                visit={v}
                selectionMode={selectionMode}
                selected={v.id !== undefined && selectedIds?.has(v.id)}
                onToggleSelect={onToggleSelect}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        </section>
      ))}
      {remaining > 0 && (
        <button
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="mt-4 w-full rounded-lg border border-border py-2 text-sm text-muted transition-colors hover:bg-card hover:text-fg"
        >
          显示更多（还有 {remaining} 条）
        </button>
      )}
    </div>
  );
}
