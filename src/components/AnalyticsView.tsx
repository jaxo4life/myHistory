import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getOverview,
  getDailyCounts,
  getHourlyDistribution,
  getTopDomains,
  getCategoryCounts,
  getWeekdayHourMatrix,
  getTransitionCounts,
} from '../db/queries';
import { yesterdayKey } from '../lib/url-utils';
import { formatDateLong, weekdayName, ZH_WEEKDAY_NARROW, EN_WEEKDAY_NARROW } from '../lib/date-format';
import { useI18n, catLabel, type Locale } from '../i18n';
import { useSettingsVersion } from '../store/useSettingsVersion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const MUTED = '#8E8E8E';
const TREND = '#3B82F6';
const HOUR_BASE = 'rgba(108,92,231,0.35)';
const HOUR_PEAK = '#F97316';
const WEEKDAY_ORDER: Record<Locale, number[]> = {
  zh: [1, 2, 3, 4, 5, 6, 0],
  en: [0, 1, 2, 3, 4, 5, 6],
};
const HEAT_ROW_LABELS: Record<Locale, string[]> = {
  zh: WEEKDAY_ORDER.zh.map((wd) => ZH_WEEKDAY_NARROW[wd]),
  en: WEEKDAY_ORDER.en.map((wd) => EN_WEEKDAY_NARROW[wd]),
};

const TREND_RANGES = [
  { key: '7', rangeKey: 'range.7d', days: 7 },
  { key: '30', rangeKey: 'range.30d', days: 30 },
  { key: '90', rangeKey: 'range.90d', days: 90 },
  { key: 'all', rangeKey: 'range.all', days: 36500 },
] as const;

const HEAT_LEVELS = [
  'rgba(128,128,128,0.06)',
  'rgba(108,92,231,0.22)',
  'rgba(108,92,231,0.42)',
  'rgba(108,92,231,0.66)',
  'rgba(108,92,231,0.92)',
];

function heatColor(count: number, max: number): string {
  if (count === 0 || max === 0) return HEAT_LEVELS[0];
  const level = Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
  return HEAT_LEVELS[level];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="text-muted">{label}</div>
      <div className="text-base font-bold text-fg">{payload[0].value}</div>
    </div>
  );
}

export function AnalyticsView() {
  const { t, locale } = useI18n();
  const settingsVersion = useSettingsVersion();

  const overview = useLiveQuery(() => getOverview(), []);
  const [rangeKey, setRangeKey] = useState<(typeof TREND_RANGES)[number]['key']>('30');
  const range = TREND_RANGES.find((r) => r.key === rangeKey)!;
  const daily = useLiveQuery(() => getDailyCounts(range.days), [range.days]);
  const hourly = useLiveQuery(() => getHourlyDistribution(), []);
  const top = useLiveQuery(() => getTopDomains(), []);
  const cats = useLiveQuery(() => getCategoryCounts(), [settingsVersion]);
  const matrix = useLiveQuery(() => getWeekdayHourMatrix(), []);
  const transitions = useLiveQuery(() => getTransitionCounts(), []);

  const peakHour = overview?.peakHour ?? -1;
  const maxCell = matrix && matrix.length > 0 ? Math.max(...matrix.flat(), 1) : 1;
  const transTotal = transitions?.reduce((s, x) => s + x.count, 0) ?? 0;
  const rangeTotal = (daily ?? []).reduce((s, d) => s + d.count, 0);
  const weekdayOrder = WEEKDAY_ORDER[locale];
  const heatRowLabels = HEAT_ROW_LABELS[locale];

  const heatPeak = useMemo(() => {
    if (!matrix) return { wd: -1, hr: -1, count: 0 };
    let peak = { wd: -1, hr: -1, count: 0 };
    for (let wd = 0; wd < 7; wd++) {
      for (let hr = 0; hr < 24; hr++) {
        if (matrix[wd][hr] > peak.count) peak = { wd, hr, count: matrix[wd][hr] };
      }
    }
    return peak;
  }, [matrix]);

  const todayCount = overview?.today ?? 0;
  const yesterdayCount = daily?.find((d) => d.dayKey === yesterdayKey())?.count ?? 0;
  const diff = todayCount - yesterdayCount;
  const spark = (daily ?? []).slice(-7);

  const ratio =
    yesterdayCount === 0
      ? todayCount > 0
        ? { arrow: '', text: t('analytics.noYesterday'), cls: 'text-muted' }
        : null
      : diff === 0
        ? { arrow: '—', text: t('analytics.sameYesterday'), cls: 'text-muted' }
        : diff > 0
          ? { arrow: '↑', text: t('analytics.up', { n: diff }), cls: 'text-emerald-500' }
          : { arrow: '↓', text: t('analytics.down', { n: diff }), cls: 'text-red-400' };

  const stats = [
    { label: t('analytics.kpi.week'), value: overview?.week ?? '…' },
    { label: t('analytics.kpi.dailyAvg'), value: overview?.dailyAvg ?? '…' },
    { label: t('analytics.kpi.domains'), value: overview?.domains ?? '…' },
    { label: t('analytics.kpi.total'), value: overview?.total ?? '…' },
  ];

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 rounded-2xl bg-card p-6">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="text-sm text-muted">{t('analytics.today')}</div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-5xl font-bold tracking-tight tabular-nums text-fg">
                  {todayCount}
                </span>
                {ratio && (
                  <span className={`text-sm font-medium ${ratio.cls}`}>
                    {ratio.arrow} {ratio.text}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted">
                {overview?.earliest
                  ? t('analytics.since', { date: formatDateLong(overview.earliest, locale) })
                  : ''}
              </div>
            </div>
            <div className="h-14 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark}>
                  <defs>
                    <linearGradient id="gradSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TREND} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={TREND} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={TREND}
                    strokeWidth={2}
                    fill="url(#gradSpark)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card p-4">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-fg">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-2xl bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-fg">{t('analytics.trend')}</div>
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums text-muted">
                {t('analytics.trendCount', { range: t(range.rangeKey), n: rangeTotal })}
              </span>
              <div className="flex items-center gap-0.5">
                {TREND_RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRangeKey(r.key)}
                    className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                      rangeKey === r.key
                        ? 'bg-accent text-white'
                        : 'text-muted hover:bg-bg hover:text-fg'
                    }`}
                  >
                    {t(r.rangeKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily ?? []}>
                <defs>
                  <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TREND} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={TREND} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="dayKey"
                  tick={{ fontSize: 10, fill: MUTED }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: MUTED }}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={TREND}
                  strokeWidth={2}
                  fill="url(#gradTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-fg">{t('analytics.heatmap')}</div>
            <div className="text-xs text-muted">
              {heatPeak.count > 0
                ? t('analytics.peak', {
                    wd: weekdayName(heatPeak.wd, locale),
                    hr: heatPeak.hr,
                    n: heatPeak.count,
                  })
                : ''}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-around py-0.5 text-[10px] text-muted">
              {heatRowLabels.map((l, i) => (
                <div key={i} className="flex h-3.5 items-center">
                  {l}
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-[3px]">
              {weekdayOrder.map((wd, i) => (
                <div key={wd} className="flex gap-[3px]">
                  {(matrix?.[wd] ?? new Array(24).fill(0)).map((count, hr) => (
                    <div
                      key={hr}
                      className="h-3.5 flex-1 rounded-[3px] transition hover:ring-1 hover:ring-fg/40"
                      style={{ backgroundColor: heatColor(count, maxCell) }}
                      title={t('analytics.cellTitle', {
                        wd: weekdayName(wd, locale),
                        hr,
                        n: count,
                      })}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1 flex justify-between pl-5 text-[10px] text-muted">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>23</span>
          </div>
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted">
            <span>{t('analytics.less')}</span>
            {HEAT_LEVELS.slice(1).map((c, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: c }}
              />
            ))}
            <span>{t('analytics.more')}</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-fg">{t('analytics.activeHours')}</div>
              <div className="text-xs" style={{ color: HOUR_PEAK }}>
                {peakHour >= 0
                  ? t('analytics.busiest', { hr: peakHour, hr2: peakHour + 1 })
                  : ''}
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly ?? []}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: MUTED }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: MUTED }}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(108,92,231,0.08)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(hourly ?? []).map((h) => (
                      <Cell key={h.hour} fill={h.hour === peakHour ? HOUR_PEAK : HOUR_BASE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 text-sm font-semibold text-fg">{t('analytics.sources')}</div>
            {(transitions ?? []).map(({ type, count }) => (
              <div key={type} className="mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-fg">{t('transition.' + type)}</span>
                  <span className="text-muted">
                    {count} · {transTotal ? Math.round((count / transTotal) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${transTotal ? (count / transTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {transitions && transitions.length === 0 && (
              <div className="text-sm text-muted">{t('common.noData')}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative rounded-2xl bg-card">
            <div className="absolute inset-0 flex flex-col p-5">
              <div className="mb-3 shrink-0 text-sm font-semibold text-fg">
                {t('analytics.topDomains')}
              </div>
              <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {(top ?? []).map(({ domain, count }, i) => (
                  <div key={domain} className="flex items-center gap-2 text-sm">
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-fg">{domain}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{count}</span>
                  </div>
                ))}
                {top && top.length === 0 && (
                  <div className="text-sm text-muted">{t('common.noData')}</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 text-sm font-semibold text-fg">{t('analytics.categoryDist')}</div>
            <div className="grid grid-cols-3 gap-2">
              {(cats ?? []).map(({ category, count, icon, color }) => (
                <div
                  key={category}
                  className="rounded-xl p-2 text-center"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <div className="text-xl">{icon}</div>
                  <div className="mt-0.5 truncate text-xs text-fg">
                    {catLabel(category, locale)}
                  </div>
                  <div className="text-xs font-semibold tabular-nums" style={{ color }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
