import { useLiveQuery } from 'dexie-react-hooks';
import {
  getDailyCounts,
  getHourlyDistribution,
  getTotalStats,
  getTopDomains,
} from '../db/queries';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ACCENT = '#6C5CE7';
const MUTED = '#8E8E8E';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded bg-card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-bold text-fg">{value}</div>
    </div>
  );
}

export function AnalyticsView() {
  const stats = useLiveQuery(() => getTotalStats(), []);
  const daily = useLiveQuery(() => getDailyCounts(30), []);
  const hourly = useLiveQuery(() => getHourlyDistribution(), []);
  const top = useLiveQuery(() => getTopDomains(10), []);

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      <div className="mb-6 flex gap-4">
        <StatCard label="总访问" value={stats?.total ?? '…'} />
        <StatCard label="域名数" value={stats?.domains ?? '…'} />
      </div>

      <div className="mb-6 rounded bg-card p-4">
        <div className="mb-2 text-sm font-semibold text-fg">最近 30 天访问趋势</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily ?? []}>
              <XAxis dataKey="dayKey" tick={{ fontSize: 10, fill: MUTED }} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded bg-card p-4">
          <div className="mb-2 text-sm font-semibold text-fg">时段分布（0-23 点）</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly ?? []}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: MUTED }} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded bg-card p-4">
          <div className="mb-2 text-sm font-semibold text-fg">Top 10 域名</div>
          <div className="flex flex-col gap-1">
            {(top ?? []).map(({ domain, count }, i) => (
              <div key={domain} className="flex justify-between text-sm">
                <span className="truncate text-fg">
                  {i + 1}. {domain}
                </span>
                <span className="ml-2 shrink-0 text-muted">{count}</span>
              </div>
            ))}
            {top && top.length === 0 && (
              <div className="text-sm text-muted">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
