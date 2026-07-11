import { useEffect, useState } from 'react';
import type { Visit } from '../types/visit';
import { HistoryItem } from './HistoryItem';
import { todayKey as getTodayKey, yesterdayKey as getYesterdayKey } from '../lib/url-utils';
import { formatDateGroupBody } from '../lib/date-format';
import { useI18n, type Locale } from '../i18n';
import { useLiveQuery } from 'dexie-react-hooks';
import { getCategories } from '../store/settings';

const PAGE_SIZE = 100;

function dayLabel(
  dayKey: string,
  todayKey: string,
  yesterdayKey: string,
  locale: Locale,
  t: (k: string, p?: Record<string, string | number>) => string,
): string {
  if (dayKey === todayKey) return t('date.today');
  if (dayKey === yesterdayKey) return t('date.yesterday');
  return formatDateGroupBody(dayKey, locale);
}

interface Group {
  dayKey: string;
  label: string;
  items: Visit[];
}

function groupByDay(
  visits: Visit[],
  todayKey: string,
  yesterdayKey: string,
  locale: Locale,
  t: (k: string, p?: Record<string, string | number>) => string,
): Group[] {
  const map = new Map<string, Visit[]>();
  for (const v of visits) {
    const k = v.dayKey;
    let arr = map.get(k);
    if (!arr) {
      arr = [];
      map.set(k, arr);
    }
    arr.push(v);
  }
  return [...map.entries()].map(([dayKey, items]) => ({
    dayKey,
    label: dayLabel(dayKey, todayKey, yesterdayKey, locale, t),
    items,
  }));
}

interface ListProps {
  visits: Visit[] | undefined;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onTagClick?: (tag: string) => void;
  settingsVersion: number;
}

export function HistoryList({
  visits,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onTagClick,
  settingsVersion,
}: ListProps) {
  const { t, locale } = useI18n();
  const categories = useLiveQuery(() => getCategories(), [settingsVersion]);
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [visits]);

  if (visits === undefined) {
    return <div className="py-8 text-center text-sm text-muted">{t('common.loading')}</div>;
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
        <div className="text-sm text-fg">{t('history.empty.title')}</div>
        <div className="mt-1 text-xs text-muted">{t('history.empty.hint')}</div>
      </div>
    );
  }

  const shown = visits.slice(0, limit);
  const groups = groupByDay(shown, getTodayKey(), getYesterdayKey(), locale, t);
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
                categories={categories}
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
          {t('history.showMore', { n: remaining })}
        </button>
      )}
    </div>
  );
}
