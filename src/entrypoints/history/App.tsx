import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar';
import { HistoryList } from '../../components/HistoryList';
import { ThemeToggle } from '../../components/ThemeToggle';
import { DomainStats } from '../../components/DomainStats';
import { getByDayKey, searchVisits, deleteVisits, clearAllVisits } from '../../db/queries';
import { getDayKey } from '../../lib/url-utils';
import { visitsToCSV, visitsToJSON, downloadText } from '../../lib/exporter';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, type Settings } from '../../store/settings';

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getDayKey(Date.now()));
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    await deleteVisits([...selectedIds]);
    setSelectedIds(new Set());
    setSelectionMode(false);
  }

  async function clearAll() {
    if (!confirm('确定清空全部历史记录？此操作不可撤销。')) return;
    await clearAllVisits();
    setSelectedIds(new Set());
  }

  function exportCurrent(format: 'csv' | 'json') {
    const data = listVisits ?? [];
    const name = showSearch ? 'search' : selectedDayKey;
    if (format === 'csv') {
      downloadText(`history-${name}.csv`, visitsToCSV(data), 'text/csv');
    } else {
      downloadText(`history-${name}.json`, visitsToJSON(data), 'application/json');
    }
  }

  if (!settings) return <div className="p-4 text-muted">加载中…</div>;

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border p-3">
        <span className="text-lg font-semibold">Chrome History Plus</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCurrent('csv')}
            title="导出当前列表为 CSV"
            className="rounded bg-card px-2 py-1 text-xs text-fg"
          >
            导出 CSV
          </button>
          <button
            onClick={() => exportCurrent('json')}
            title="导出当前列表为 JSON"
            className="rounded bg-card px-2 py-1 text-xs text-fg"
          >
            导出 JSON
          </button>
          <ThemeToggle />
        </div>
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标题 / URL / 域名…"
              className="min-w-0 flex-1 rounded bg-card px-3 py-1.5 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
            />
            <input
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              placeholder="域名过滤"
              className="w-28 rounded bg-card px-3 py-1.5 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
            />
            {selectionMode ? (
              <>
                <span className="text-xs text-muted">已选 {selectedIds.size}</span>
                <button
                  onClick={deleteSelected}
                  disabled={selectedIds.size === 0}
                  className="rounded bg-accent px-2 py-1.5 text-xs text-white disabled:opacity-40"
                >
                  删除选中
                </button>
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="rounded bg-card px-2 py-1.5 text-xs text-fg"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectionMode(true)}
                className="rounded bg-card px-2 py-1.5 text-xs text-fg"
              >
                选择
              </button>
            )}
          </div>
          <div className="mb-3 text-sm text-muted">
            {showSearch ? `搜索结果：${listVisits?.length ?? 0} 条` : `已选：${selectedDayKey}`}
          </div>
          <HistoryList
            visits={listVisits}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        </main>
        {/* 右栏：最常访问 + 清空 */}
        <aside className="no-scrollbar flex w-1/4 flex-col overflow-y-auto border-l border-border p-4">
          <div className="mb-2 text-sm font-semibold text-fg">最常访问</div>
          <div className="flex-1">
            <DomainStats onPick={setDomainFilter} />
          </div>
          <button
            onClick={clearAll}
            className="mt-4 w-full rounded bg-accent px-3 py-2 text-sm text-white hover:opacity-90"
          >
            清空全部历史
          </button>
        </aside>
      </div>
    </div>
  );
}

export default App;
