import { useEffect, useMemo, useState } from 'react';
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
import { getDayKey } from '../lib/url-utils';
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
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 周一开始
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const WEEKDAY_CN_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']; // 索引 = getDay

// 趋势时间段：days 传给 getDailyCounts；'全部' 用一个足够大的天数近似全历史
const TREND_RANGES = [
  { key: '7', label: '7天', days: 7 },
  { key: '30', label: '30天', days: 30 },
  { key: '90', label: '90天', days: 90 },
  { key: 'all', label: '全部', days: 36500 },
] as const;

// 离散色阶：0=无数据灰，1-4=紫由浅到深
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

const TRANSITION_LABELS: Record<string, string> = {
  link: '链接点击',
  typed: '地址栏输入',
  reload: '刷新',
  generated: '页面生成',
  auto_bookmark: '书签',
  auto_subframe: '子框架',
  auto_toplevel: '顶层框架',
  form_submit: '表单提交',
  keyword: '关键字',
  keyword_generated: '关键字生成',
  manual_subframe: '手动子框架',
  redirect: '重定向',
  restore: '会话恢复',
  start_page: '起始页',
};

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
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
  // 分类规则存在 chrome.storage，liveQuery 默认只监听 db；用 version 在 storage 变化时驱动重算
  const [settingsVersion, setSettingsVersion] = useState(0);
  useEffect(() => {
    const handler = () => setSettingsVersion((v) => v + 1);
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

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
  const transTotal = transitions?.reduce((s, t) => s + t.count, 0) ?? 0;
  const rangeTotal = (daily ?? []).reduce((s, d) => s + d.count, 0);

  // 热力峰值格：最活跃的星期 + 小时
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

  // 今日 vs 昨日环比（昨天落在所有可选范围内）
  const todayCount = overview?.today ?? 0;
  const yesterdayKey = getDayKey(Date.now() - 86_400_000);
  const yesterdayCount = daily?.find((d) => d.dayKey === yesterdayKey)?.count ?? 0;
  const diff = todayCount - yesterdayCount;
  const spark = (daily ?? []).slice(-7);

  const ratio =
    yesterdayCount === 0
      ? todayCount > 0
        ? { arrow: '', text: '昨日无记录', cls: 'text-muted' }
        : null
      : diff === 0
        ? { arrow: '—', text: '与昨日持平', cls: 'text-muted' }
        : diff > 0
          ? { arrow: '↑', text: `比昨日 +${diff}`, cls: 'text-emerald-500' }
          : { arrow: '↓', text: `比昨日 ${diff}`, cls: 'text-red-400' };

  const stats = [
    { label: '本周', value: overview?.week ?? '…' },
    { label: '日均', value: overview?.dailyAvg ?? '…' },
    { label: '域名数', value: overview?.domains ?? '…' },
    { label: '总访问', value: overview?.total ?? '…' },
  ];

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-[1200px]">
      {/* Hero：今日焦点 */}
      <div className="mb-6 rounded-2xl bg-card p-6">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="text-sm text-muted">今日访问</div>
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
              {overview?.earliest ? `数据自 ${formatDate(overview.earliest)}` : ''}
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

      {/* 次要 KPI（中性灰，不再彩虹） */}
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

      {/* 主图：访问趋势（放大 + 时间段切换） */}
      <div className="mb-6 rounded-2xl bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-fg">访问趋势</div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted">
              {range.label} · {rangeTotal} 次
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
                  {r.label}
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

      {/* 一周×时段热力图 */}
      <div className="mb-6 rounded-2xl bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-fg">一周 × 时段热力</div>
          <div className="text-xs text-muted">
            {heatPeak.count > 0
              ? `峰值 ${WEEKDAY_CN_FULL[heatPeak.wd]} ${heatPeak.hr}:00 · ${heatPeak.count} 次`
              : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col justify-around py-0.5 text-[10px] text-muted">
            {WEEKDAY_LABELS.map((l) => (
              <div key={l} className="flex h-3.5 items-center">
                {l}
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-[3px]">
            {WEEKDAY_ORDER.map((wd, i) => (
              <div key={wd} className="flex gap-[3px]">
                {(matrix?.[wd] ?? new Array(24).fill(0)).map((count, hr) => (
                  <div
                    key={hr}
                    className="h-3.5 flex-1 rounded-[3px] transition hover:ring-1 hover:ring-fg/40"
                    style={{ backgroundColor: heatColor(count, maxCell) }}
                    title={`${WEEKDAY_LABELS[i]} ${hr}:00 · ${count} 次`}
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
          <span>少</span>
          {HEAT_LEVELS.slice(1).map((c, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: c }}
            />
          ))}
          <span>多</span>
        </div>
      </div>

      {/* 活跃时段 + 访问来源 */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-fg">活跃时段</div>
            <div className="text-xs" style={{ color: HOUR_PEAK }}>
              {peakHour >= 0 ? `最忙 ${peakHour}:00–${peakHour + 1}:00` : ''}
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
          <div className="mb-3 text-sm font-semibold text-fg">访问来源</div>
          {(transitions ?? []).map(({ type, count }) => (
            <div key={type} className="mb-2">
              <div className="flex justify-between text-xs">
                <span className="text-fg">{TRANSITION_LABELS[type] ?? type}</span>
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
            <div className="text-sm text-muted">暂无数据</div>
          )}
        </div>
      </div>

      {/* Top 域名 + 分类分布 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative rounded-2xl bg-card">
          <div className="absolute inset-0 flex flex-col p-5">
            <div className="mb-3 shrink-0 text-sm font-semibold text-fg">最常访问</div>
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
              {top && top.length === 0 && <div className="text-sm text-muted">暂无数据</div>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5">
          <div className="mb-3 text-sm font-semibold text-fg">分类分布</div>
          <div className="grid grid-cols-3 gap-2">
            {(cats ?? []).map(({ category, count, icon, color }) => (
              <div
                key={category}
                className="rounded-xl p-2 text-center"
                style={{ backgroundColor: `${color}14` }}
              >
                <div className="text-xl">{icon}</div>
                <div className="mt-0.5 truncate text-xs text-fg">{category}</div>
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
