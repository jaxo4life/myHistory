import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar';
import { HistoryList } from '../../components/HistoryList';
import { ThemeToggle } from '../../components/ThemeToggle';
import { DomainStats } from '../../components/DomainStats';
import { getByDayKey, searchVisits } from '../../db/queries';
import { getDayKey } from '../../lib/url-utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, type Settings } from '../../store/settings';

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getDayKey(Date.now()));
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const visits = useLiveQuery(() => getByDayKey(selectedDayKey), [selectedDayKey]);
  const showSearch = searchQuery.trim() !== '' || domainFilter.trim() !== '';
  const searchResults = useLiveQuery(
    () => searchVisits({ query: searchQuery, domain: domainFilter }),
    [searchQuery, domainFilter],
  );
  const listVisits = showSearch ? searchResults : visits;

  if (!settings) return <div className="p-4 text-muted">加载中…</div>;

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border p-3">
        <span className="text-lg font-semibold">Chrome History Plus</span>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* 左栏：日历 */}
        <aside className="w-1/4 border-r border-border p-4">
          <Calendar
            weekStart={settings.weekStart}
            selectedDayKey={selectedDayKey}
            onSelect={setSelectedDayKey}
          />
        </aside>
        {/* 中栏：搜索 + 历史 */}
        <main className="no-scrollbar w-1/2 overflow-y-auto p-4">
          <div className="mb-3 flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标题 / URL / 域名…"
              className="flex-1 rounded bg-card px-3 py-1.5 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
            />
            <input
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              placeholder="域名过滤"
              className="w-32 rounded bg-card px-3 py-1.5 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
            />
          </div>
          <div className="mb-3 text-sm text-muted">
            {showSearch
              ? `搜索结果：${listVisits?.length ?? 0} 条`
              : `已选：${selectedDayKey}`}
          </div>
          <HistoryList visits={listVisits} />
        </main>
        {/* 右栏：最常访问域名（点击联动中栏过滤） */}
        <aside className="no-scrollbar w-1/4 overflow-y-auto border-l border-border p-4">
          <div className="mb-2 text-sm font-semibold text-fg">最常访问</div>
          <DomainStats onPick={setDomainFilter} />
        </aside>
      </div>
    </div>
  );
}

export default App;
