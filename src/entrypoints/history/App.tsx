import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar';
import { HistoryList } from '../../components/HistoryList';
import { ThemeToggle } from '../../components/ThemeToggle';
import { DomainStats } from '../../components/DomainStats';
import { CategoryStats } from '../../components/CategoryStats';
import { TagStats } from '../../components/TagStats';
import { DaySummary } from '../../components/DaySummary';
import { AnalyticsView } from '../../components/AnalyticsView';
import { ManageView } from '../../components/ManageView';
import { getByDayKey, searchVisits, deleteVisits } from '../../db/queries';
import { getDayKey } from '../../lib/url-utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, type Settings } from '../../store/settings';

type View = 'history' | 'analytics' | 'manage';

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [view, setView] = useState<View>('history');
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getDayKey(Date.now()));
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // 分类规则存在 chrome.storage，liveQuery 默认只监听 db；用 version 在 storage 变化时驱动重算
  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const handler = () => setSettingsVersion((v) => v + 1);
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const visits = useLiveQuery(() => getByDayKey(selectedDayKey), [selectedDayKey]);
  const hasFilter =
    searchQuery.trim() !== '' || domainFilter.trim() !== '' || categoryFilter !== '' || tagFilter !== '';
  const searchResults = useLiveQuery(
    () => searchVisits({ query: searchQuery, domain: domainFilter, category: categoryFilter, tag: tagFilter }),
    [searchQuery, domainFilter, categoryFilter, tagFilter, settingsVersion],
  );
  const listVisits = hasFilter ? searchResults : visits;

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

  function selectAll() {
    const ids = (listVisits ?? [])
      .map((v) => v.id)
      .filter((x): x is number => x !== undefined);
    setSelectedIds(new Set(ids));
  }

  if (!settings) return <div className="p-4 text-muted">加载中…</div>;

  const tabs: { v: View; label: string }[] = [
    { v: 'history', label: '历史' },
    { v: 'analytics', label: '分析' },
    { v: 'manage', label: '管理' },
  ];

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-5">
          <img src="/icon/512.png" alt="myHistory" className="h-16 w-16" />
          <nav className="flex h-16">
            {tabs.map(({ v, label }) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`relative flex h-full items-center px-4 text-sm transition-colors ${
                    active ? 'text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 bg-accent" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <ThemeToggle />
      </header>

      {view === 'analytics' ? (
        <AnalyticsView />
      ) : view === 'manage' ? (
        <ManageView />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* 左栏：日历 */}
          <aside className="w-72 shrink-0 p-5">
            <Calendar
              weekStart={settings.weekStart}
              selectedDayKey={selectedDayKey}
              onSelect={setSelectedDayKey}
            />
            <div className="mt-6">
              <div className="mb-2 text-xs font-medium tracking-wide text-muted">当日概览</div>
              <DaySummary dayKey={selectedDayKey} />
            </div>
          </aside>
          {/* 中栏：搜索 + 历史 */}
          <main className="no-scrollbar flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <circle cx="7" cy="7" r="5" />
                  <path d="M11 11l3 3" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索标题 / URL / 域名…"
                  className="w-full rounded-lg bg-card py-2 pl-9 pr-3 text-sm text-fg outline-none ring-1 ring-border transition-shadow focus:ring-accent"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {selectionMode ? (
                  <>
                    <span className="text-xs text-muted">已选 {selectedIds.size} 条</span>
                    <button
                      onClick={selectAll}
                      className="rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border"
                    >
                      全选
                    </button>
                    <button
                      onClick={deleteSelected}
                      disabled={selectedIds.size === 0}
                      className="rounded-lg bg-accent px-2.5 py-1 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      删除选中
                    </button>
                    <button
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="ml-auto rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                      placeholder="域名"
                      className="w-28 rounded-lg bg-card px-2.5 py-1 text-xs text-fg outline-none ring-1 ring-border transition-shadow focus:ring-accent"
                    />
                    {categoryFilter && (
                      <button
                        onClick={() => setCategoryFilter('')}
                        className="rounded-lg bg-accent/15 px-2 py-1 text-xs text-accent transition-colors hover:bg-accent/25"
                      >
                        类别: {categoryFilter} ✕
                      </button>
                    )}
                    {tagFilter && (
                      <button
                        onClick={() => setTagFilter('')}
                        className="rounded-lg bg-accent/15 px-2 py-1 text-xs text-accent transition-colors hover:bg-accent/25"
                      >
                        #{tagFilter} ✕
                      </button>
                    )}
                    {hasFilter && (
                      <span className="text-xs text-muted">
                        {listVisits?.length ?? 0} 条结果
                      </span>
                    )}
                    <button
                      onClick={() => setSelectionMode(true)}
                      className="ml-auto rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border"
                    >
                      选择
                    </button>
                  </>
                )}
              </div>
            </div>
            <HistoryList
              visits={listVisits}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onTagClick={setTagFilter}
            />
          </main>
          {/* 右栏：分类 + 标签 + 最常访问 */}
          <aside className="no-scrollbar flex w-[300px] shrink-0 flex-col overflow-y-auto p-5">
            <div className="mb-1 text-sm font-semibold text-fg">分类</div>
            <CategoryStats onPick={setCategoryFilter} version={settingsVersion} />
            <div className="mb-1 mt-4 text-sm font-semibold text-fg">标签</div>
            <TagStats onPick={setTagFilter} version={settingsVersion} />
            <div className="mb-1 mt-4 text-sm font-semibold text-fg">最常访问</div>
            <div className="flex-1">
              <DomainStats onPick={setDomainFilter} limit={10} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
