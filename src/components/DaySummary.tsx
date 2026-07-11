import { useLiveQuery } from 'dexie-react-hooks';
import { getByDayKey } from '../db/queries';
import { useI18n } from '../i18n';

export function DaySummary({ dayKey }: { dayKey: string }) {
  const { t } = useI18n();
  const visits = useLiveQuery(() => getByDayKey(dayKey), [dayKey]);

  if (visits === undefined) return null;

  if (visits.length === 0) {
    return (
      <div className="rounded-xl bg-card p-3 text-xs text-muted">{t('daySummary.empty')}</div>
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
        <span className="text-xs text-muted">{t('daySummary.count')}</span>
      </div>
      <div className="mt-1 truncate text-xs text-muted" title={top[0]}>
        {t('daySummary.topDomain', { domain: top[0], count: top[1] })}
      </div>
    </div>
  );
}
