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
  getDerivedMetrics,
  getDiscoveryRate,
  getCompare,
  getCategoryTrend,
  getTagStats,
  getSessionStats,
  getBehaviorProfile,
  getWeekdayVsWeekend,
} from '../db/queries';
import { yesterdayKey } from '../lib/url-utils';
import { formatDateLong, weekdayName, ZH_WEEKDAY_NARROW, EN_WEEKDAY_NARROW } from '../lib/date-format';
import { useI18n, catLabel, type Locale } from '../i18n';
import { useSettingsVersion } from '../store/useSettingsVersion';
import {
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';

const MUTED = '#8E8E8E';
const TREND = '#3B82F6';
const ACCENT = '#6C5CE7';
const MA_COLOR = '#F97316';
const HOUR_BASE = 'rgba(108,92,231,0.35)';
const HOUR_PEAK = '#F97316';
const WEEKDAY_COLOR = '#3B82F6';
const WEEKEND_COLOR = '#EC4899';
const CAT_PALETTE = [
  '#6C5CE7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#64748B',
];

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
      {label !== undefined && <div className="text-muted">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="font-semibold text-fg">
          {p.name}: <span className="tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function withMovingAvg(data: { dayKey: string; count: number }[], window = 7) {
  return data.map((d, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const ma = slice.reduce((s, x) => s + x.count, 0) / slice.length;
    return { ...d, ma: Math.round(ma) };
  });
}

function archetypes(
  profile:
    | { activity: number; diversity: number; focus: number; regularity: number }
    | undefined,
  peakHour: number,
): string[] {
  if (!profile || (profile.activity === 0 && profile.diversity === 0)) return [];
  const tags: string[] = [];
  if (peakHour >= 22 || peakHour < 5) tags.push('nightOwl');
  else if (peakHour >= 5 && peakHour < 10) tags.push('earlyBird');
  if (profile.diversity >= 60) tags.push('explorer');
  else if (profile.focus >= 55) tags.push('deepDive');
  if (profile.regularity >= 65) tags.push('regular');
  else if (profile.regularity < 35) tags.push('erratic');
  return tags;
}

function Delta({ change }: { change: number | undefined }) {
  if (change === undefined || !isFinite(change) || change === 0)
    return <span className="text-xs text-muted">—</span>;
  const up = change > 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-500' : 'text-red-400'}`}>
      {up ? '↑' : '↓'} {Math.abs(Math.round(change * 100))}%
    </span>
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
  const derived = useLiveQuery(() => getDerivedMetrics(), []);
  const discovery = useLiveQuery(() => getDiscoveryRate(30), []);
  const compareWeek = useLiveQuery(() => getCompare('week'), []);
  const profile = useLiveQuery(() => getBehaviorProfile(), []);
  const catTrend = useLiveQuery(() => getCategoryTrend(30), [settingsVersion]);
  const tagStats = useLiveQuery(() => getTagStats(), [settingsVersion]);
  const sessions = useLiveQuery(() => getSessionStats(), []);
  const wdWe = useLiveQuery(() => getWeekdayVsWeekend(), []);

  const peakHour = overview?.peakHour ?? -1;
  const maxCell = matrix && matrix.length > 0 ? Math.max(...matrix.flat(), 1) : 1;
  const transTotal = transitions?.reduce((s, x) => s + x.count, 0) ?? 0;
  const rangeTotal = (daily ?? []).reduce((s, d) => s + d.count, 0);
  const weekdayOrder = WEEKDAY_ORDER[locale];
  const heatRowLabels = HEAT_ROW_LABELS[locale];

  const dailyMA = useMemo(() => withMovingAvg(daily ?? []), [daily]);
  const tags = archetypes(profile, peakHour);
  const radarData = profile
    ? [
        { subject: t('analytics.profile.activity'), value: profile.activity },
        { subject: t('analytics.profile.diversity'), value: profile.diversity },
        { subject: t('analytics.profile.focus'), value: profile.focus },
        { subject: t('analytics.profile.discovery'), value: profile.discovery },
        { subject: t('analytics.profile.regularity'), value: profile.regularity },
      ]
    : [];

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

  const spark = (daily ?? []).slice(-7);
  const maxAvg = Math.max(wdWe?.weekday.avg ?? 0, wdWe?.weekend.avg ?? 0, 1);
  const maxTagCount = tagStats?.top[0]?.count ?? 1;

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="rounded-2xl bg-card p-6">
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
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent"
                    >
                      {t('analytics.archetype.' + a)}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 text-xs text-muted">
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
                  <Area type="monotone" dataKey="count" stroke={TREND} strokeWidth={2} fill="url(#gradSpark)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('analytics.metric.concentration'), value: derived ? `${Math.round(derived.concentrationTop5 * 100)}%` : '…', hint: t('analytics.metric.concentrationHint') },
            { label: t('analytics.profile.diversity'), value: derived ? `${Math.round(derived.diversity * 100)}%` : '…', hint: t('analytics.metric.diversityHint') },
            { label: t('analytics.metric.discovery'), value: discovery ? `${Math.round(discovery.rate * 100)}%` : '…', hint: t('analytics.metric.discoveryHint') },
            { label: t('analytics.metric.loyalty'), value: derived ? `${Math.round(derived.loyalty * 100)}%` : '…', hint: t('analytics.metric.loyaltyHint') },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-card p-4">
              <div className="text-xs text-muted">{m.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-fg">{m.value}</div>
              <div className="mt-1 text-[10px] leading-tight text-muted">{m.hint}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('analytics.kpi.total'), value: overview?.total ?? '…', change: undefined },
            { label: t('analytics.kpi.week'), value: overview?.week ?? '…', change: compareWeek?.change },
            { label: t('analytics.kpi.dailyAvg'), value: overview?.dailyAvg ?? '…', change: undefined },
            { label: t('analytics.kpi.domains'), value: derived?.uniqueDomains ?? overview?.domains ?? '…', change: undefined },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">{m.label}</div>
                {m.change !== undefined && <Delta change={m.change} />}
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-fg">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 text-sm font-semibold text-fg">{t('analytics.profile.title')}</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="rgba(128,128,128,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: MUTED }} />
                  <Radar dataKey="value" stroke={ACCENT} fill={ACCENT} fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-2 rounded-2xl bg-card p-5">
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
                        rangeKey === r.key ? 'bg-accent text-white' : 'text-muted hover:bg-bg hover:text-fg'
                      }`}
                    >
                      {t(r.rangeKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyMA}>
                  <defs>
                    <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TREND} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={TREND} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dayKey" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke={TREND} strokeWidth={1.5} fill="url(#gradTrend)" />
                  <Line type="monotone" dataKey="ma" name={t('analytics.movingAvg')} stroke={MA_COLOR} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-fg">{t('analytics.heatmap')}</div>
            <div className="text-xs text-muted">
              {heatPeak.count > 0
                ? t('analytics.peak', { wd: weekdayName(heatPeak.wd, locale), hr: heatPeak.hr, n: heatPeak.count })
                : ''}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-around py-0.5 text-[10px] text-muted">
              {heatRowLabels.map((l, i) => (
                <div key={i} className="flex h-3.5 items-center">{l}</div>
              ))}
            </div>
            <div className="flex-1 space-y-[3px]">
              {weekdayOrder.map((wd) => (
                <div key={wd} className="flex gap-[3px]">
                  {(matrix?.[wd] ?? new Array(24).fill(0)).map((count, hr) => (
                    <div
                      key={hr}
                      className="h-3.5 flex-1 rounded-[3px] transition hover:ring-1 hover:ring-fg/40"
                      style={{ backgroundColor: heatColor(count, maxCell) }}
                      title={t('analytics.cellTitle', { wd: weekdayName(wd, locale), hr, n: count })}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1 flex justify-between pl-5 text-[10px] text-muted">
            <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex h-52 flex-col rounded-2xl bg-card p-5">
            <div className="mb-3 shrink-0 text-sm font-semibold text-fg">{t('analytics.weekdayVsWeekend')}</div>
            <div className="flex flex-1 flex-col justify-center gap-3">
              {[
                { label: t('analytics.weekday'), avg: wdWe?.weekday.avg ?? 0, color: WEEKDAY_COLOR },
                { label: t('analytics.weekend'), avg: wdWe?.weekend.avg ?? 0, color: WEEKEND_COLOR },
              ].map((x) => (
                <div key={x.label}>
                  <div className="flex justify-between text-xs">
                    <span className="text-fg">{x.label}</span>
                    <span className="text-muted tabular-nums">
                      {Math.round(x.avg)} {t('analytics.perDay')}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full" style={{ width: `${(x.avg / maxAvg) * 100}%`, backgroundColor: x.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-52 flex-col rounded-2xl bg-card p-5">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <div className="text-sm font-semibold text-fg">{t('analytics.activeHours')}</div>
              <div className="text-xs" style={{ color: HOUR_PEAK }}>
                {peakHour >= 0 ? t('analytics.busiest', { hr: peakHour, hr2: peakHour + 1 }) : ''}
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly ?? []}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,92,231,0.08)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(hourly ?? []).map((h) => (
                      <Cell key={h.hour} fill={h.hour === peakHour ? HOUR_PEAK : HOUR_BASE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex h-52 flex-col rounded-2xl bg-card p-5">
            <div className="mb-3 shrink-0 text-sm font-semibold text-fg">{t('analytics.sources')}</div>
            <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {(transitions ?? []).map(({ type, count }) => (
                <div key={type}>
                  <div className="flex justify-between text-xs">
                    <span className="text-fg">{t('transition.' + type)}</span>
                    <span className="text-muted">
                      {count} · {transTotal ? Math.round((count / transTotal) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${transTotal ? (count / transTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
              {transitions && transitions.length === 0 && (
                <div className="text-sm text-muted">{t('common.noData')}</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 text-sm font-semibold text-fg">{t('analytics.categoryTrend')}</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={catTrend?.points ?? []}>
                  <XAxis dataKey="dayKey" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  {(catTrend?.categories ?? []).map((c, i) => (
                    <Area
                      key={c}
                      type="monotone"
                      dataKey={c}
                      stackId="1"
                      stroke={CAT_PALETTE[i % CAT_PALETTE.length]}
                      fill={CAT_PALETTE[i % CAT_PALETTE.length]}
                      fillOpacity={0.7}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(catTrend?.categories ?? []).map((c, i) => (
                <span key={c} className="flex items-center gap-1 text-[10px] text-muted">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CAT_PALETTE[i % CAT_PALETTE.length] }} />
                  {catLabel(c, locale)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 text-sm font-semibold text-fg">{t('analytics.session.title')}</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t('analytics.session.count'), value: sessions?.sessions ?? '…' },
                { label: t('analytics.session.perDay'), value: sessions ? sessions.avgPerDay.toFixed(1) : '…' },
                { label: t('analytics.session.avgLength'), value: sessions ? Math.round(sessions.avgLength) : '…' },
                { label: t('analytics.session.longest'), value: sessions?.longestSession ?? '…' },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-bg/50 p-3">
                  <div className="text-[10px] text-muted">{m.label}</div>
                  <div className="mt-0.5 text-xl font-semibold tabular-nums text-fg">{m.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs">
                <span className="text-fg">{t('analytics.session.distraction')}</span>
                <span className="text-muted tabular-nums">
                  {sessions ? Math.round(sessions.distractionIndex * 100) : 0}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full" style={{ width: `${sessions ? sessions.distractionIndex * 100 : 0}%`, backgroundColor: HOUR_PEAK }} />
              </div>
              <div className="mt-1 text-[10px] leading-tight text-muted">{t('analytics.session.distractionHint')}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="relative rounded-2xl bg-card">
            <div className="absolute inset-0 flex flex-col p-5">
              <div className="mb-3 shrink-0 text-sm font-semibold text-fg">{t('analytics.topDomains')}</div>
              <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {(top ?? []).map(({ domain, count }, i) => (
                  <div key={domain} className="flex items-center gap-2 text-sm">
                    <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-fg">{domain}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{count}</span>
                  </div>
                ))}
                {top && top.length === 0 && <div className="text-sm text-muted">{t('common.noData')}</div>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 text-sm font-semibold text-fg">{t('analytics.categoryDist')}</div>
            <div className="grid grid-cols-3 gap-2">
              {(cats ?? []).map(({ category, count, icon, color }) => (
                <div key={category} className="rounded-xl p-2 text-center" style={{ backgroundColor: `${color}14` }}>
                  <div className="text-xl">{icon}</div>
                  <div className="mt-0.5 truncate text-xs text-fg">{catLabel(category, locale)}</div>
                  <div className="text-xs font-semibold tabular-nums" style={{ color }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-fg">{t('analytics.tagStats')}</div>
              <span className="text-xs text-muted tabular-nums">{tagStats?.uniqueTags ?? 0}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(tagStats?.top ?? []).slice(0, 24).map(({ tag, count }) => {
                const opacity = 0.4 + (count / maxTagCount) * 0.6;
                return (
                  <span
                    key={tag}
                    className="rounded-full bg-accent px-2 py-0.5 text-xs text-white"
                    style={{ opacity }}
                  >
                    #{tag} <span className="tabular-nums">{count}</span>
                  </span>
                );
              })}
              {tagStats && tagStats.uniqueTags === 0 && (
                <div className="text-xs text-muted">{t('analytics.tagEmpty')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
