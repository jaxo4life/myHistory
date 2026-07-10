import type { Visit } from '../types/visit';
import { HistoryItem } from './HistoryItem';

export function HistoryList({ visits }: { visits: Visit[] | undefined }) {
  if (visits === undefined) {
    return <div className="p-4 text-muted">加载中…</div>;
  }
  if (visits.length === 0) {
    return <div className="p-4 text-muted">这一天没有浏览记录。</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {visits.map((v) => (
        <HistoryItem key={v.id} visit={v} />
      ))}
    </div>
  );
}
