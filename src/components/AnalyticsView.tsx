import { useLiveQuery } from 'dexie-react-hooks';
import {
  getOverview,
  getDailyCounts,
  getHourlyDistribution,
  getTopDomains,
  getCategoryCounts,
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

const ACCENT = '#6C5CE7';
const MUTED = '#8E8E8E';

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
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 p-5 ring-1 ring-accent/10">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums text-fg">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function AnalyticsView() {
  const overview = useLiveQuery(() => getOverview(), []);
  const daily = useLiveQuery(() => getDailyCounts(30), []);
  const hourly = useLiveQuery(() => getHourlyDistribution(), []);
  const top = useLiveQuery(() => getTopDomains(20), []);
  const cats = useLiveQuery(() => getCategoryCounts(), []);

  const peakHour = overview?.peakHour ?? -1;
  const maxCat = cats && cats.length > 0 ? cats[0].count : 1;

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="总访问" value={overview?.total ?? '…'} hint="全部累计" />
        <Kpi label="域名数" value={overview?.domains ?? '…'} hint="不同站点" />
        <Kpi label="今日" value={overview?.today ?? '…'} hint="本日访问" />
        <Kpi label="本周" value={overview?.week ?? '…'} hint="近 7 天" />
      </div>

      {/* 访问趋势 */}
      <div className="mb-6 rounded-2xl bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-fg">访问趋势</div>
          <div className="text-xs text-muted">
            近 30 天 · 日均 {overview?.dailyAvg ?? '…'} 次
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily ?? []}>
              <defs>
                <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
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
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#gradTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 时段 + Top 域名 */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-fg">活跃时段</div>
            <div className="text-xs text-muted">
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
                    <Cell
                      key={h.hour}
                      fill={h.hour === peakHour ? ACCENT : 'rgba(108,92,231,0.35)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5">
          <div className="mb-3 text-sm font-semibold text-fg">最常访问 Top 20</div>
          <div className="no-scrollbar flex h-40 flex-col gap-1 overflow-y-auto">
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
      </div>

      {/* 分类分布卡片 */}
      <div className="mb-6 rounded-2xl bg-card p-5">
        <div className="mb-3 text-sm font-semibold text-fg">分类分布</div>
        <div className="grid grid-cols-4 gap-3">
          {(cats ?? []).map(({ category, count, icon }) => (
            <div key={category} className="rounded-xl bg-bg p-3 text-center">
              <div className="text-2xl">{icon}</div>
              <div className="mt-1 truncate text-sm text-fg">{category}</div>
              <div className="text-xs text-muted">{count}</div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${(count / maxCat) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <CategoryManager />
    </div>
  );
}
