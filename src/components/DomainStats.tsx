import { useLiveQuery } from 'dexie-react-hooks';
import { getTopDomains } from '../db/queries';

/** 右栏：最常访问域名列表，点击某域名回调（用于联动中栏过滤）。 */
export function DomainStats({ onPick }: { onPick: (domain: string) => void }) {
  const top = useLiveQuery(() => getTopDomains(30), []);

  if (!top) return <div className="text-sm text-muted">加载中…</div>;
  if (top.length === 0) return <div className="text-sm text-muted">暂无数据</div>;

  const max = top[0].count;

  return (
    <div className="flex flex-col gap-1">
      {top.map(({ domain, count }) => (
        <button
          key={domain}
          onClick={() => onPick(domain)}
          className="group relative flex items-center justify-between overflow-hidden rounded px-2 py-1 text-left text-sm hover:bg-card"
          title={`按 ${domain} 过滤`}
        >
          <span
            className="absolute left-0 top-0 h-full bg-accent opacity-10"
            style={{ width: `${(count / max) * 100}%` }}
          />
          <span className="relative truncate text-fg">{domain}</span>
          <span className="relative ml-2 shrink-0 text-xs text-muted">{count}</span>
        </button>
      ))}
    </div>
  );
}
