import { useEffect, useState } from 'react';
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
import { CategoryManager } from './CategoryManager';

const MUTED = '#8E8E8E';
const TREND = '#3B82F6';
const HOUR_BASE = 'rgba(108,92,231,0.35)';
const HOUR_PEAK = '#F97316';
const KPI_COLORS = ['#6C5CE7', '#3B82F6', '#14B8A6', '#EC4899'];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 周一开始
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
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

function Kpi({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: number | string;
  hint?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: `linear-gradient(135deg, ${color}26, ${color}08)`,
        boxShadow: `inset 0 0 0 1px ${color}26`,
      }}
    >
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
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
  const daily = useLiveQuery(() => getDailyCounts(30), []);
  const hourly = useLiveQuery(() => getHourlyDistribution(), []);
  const top = useLiveQuery(() => getTopDomains(20), []);
  const cats = useLiveQuery(() => getCategoryCounts(), [settingsVersion]);
  const matrix = useLiveQuery(() => getWeekdayHourMatrix(), []);
  const transitions = useLiveQuery(() => getTransitionCounts(), []);

  const peakHour = overview?.peakHour ?? -1;
  const maxCat = cats && cats.length > 0 ? cats[0].count : 1;
  const maxCell = matrix && matrix.length > 0 ? Math.max(...matrix.flat(), 1) : 1;
  const transTotal = transitions?.reduce((s, t) => s + t.count, 0) ?? 0;

  const kpis = [
    { label: '总访问', value: overview?.total ?? '…', hint: '全部累计', color: KPI_COLORS[0] },
    { label: '域名数', value: overview?.domains ?? '…', hint: '不同站点', color: KPI_COLORS[1] },
    { label: '今日', value: overview?.today ?? '…', hint: '本日访问', color: KPI_COLORS[2] },
    { label: '本周', value: overview?.week ?? '…', hint: '近 7 天', color: KPI_COLORS[3] },
  ];

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      {/* 访问趋势 */}
      <div className="mb-6 rounded-2xl bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-fg">访问趋势</div>
          <div className="text-xs text-muted">
            {overview?.earliest ? `数据自 ${formatDate(overview.earliest)}` : '近 30 天'}
            {' · '}日均 {overview?.dailyAvg ?? '…'} 次
          </div>
        </div>
        <div className="h-56">
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
        <div className="mb-3 text-sm font-semibold text-fg">一周 × 时段热力</div>
        <div className="flex gap-2">
          <div className="flex flex-col justify-around py-0.5 text-[10px] text-muted">
            {WEEKDAY_LABELS.map((l) => (
              <div key={l} className="h-3 leading-3">
                {l}
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-px">
            {WEEKDAY_ORDER.map((wd, i) => (
              <div key={wd} className="flex gap-px">
                {(matrix?.[wd] ?? new Array(24).fill(0)).map((count, hr) => (
                  <div
                    key={hr}
                    className="h-3 flex-1 rounded-sm"
                    style={{
                      backgroundColor:
                        count > 0
                          ? `rgba(108,92,231,${0.15 + (count / maxCell) * 0.85})`
                          : 'rgba(128,128,128,0.08)',
                    }}
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
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card p-5">
          <div className="mb-3 text-sm font-semibold text-fg">最常访问 Top 20</div>
          <div className="no-scrollbar flex h-56 flex-col gap-1 overflow-y-auto">
            {(top ?? []).map(({ domain, count }, i) => (
              <div key={domain} className="flex items-center gap-2 text-sm">
                <span className="w-5 shrink-0 text-right text-xs text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{domain}</span>
                <span className="shrink-0 text-xs text-muted">{count}</span>
              </div>
            ))}
            {top && top.length === 0 && <div className="text-sm text-muted">暂无数据</div>}
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
                <div className="text-xs font-semibold" style={{ color }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CategoryManager />
    </div>
  );
}
