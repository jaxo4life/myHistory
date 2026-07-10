import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar';
import { HistoryList } from '../../components/HistoryList';
import { ThemeToggle } from '../../components/ThemeToggle';
import { DomainStats } from '../../components/DomainStats';
import { CategoryStats } from '../../components/CategoryStats';
import { TagStats } from '../../components/TagStats';
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

  if (!settings) return <div className="p-4 text-muted">加载中…</div>;

  const tabBtn = (v: View) =>
    `rounded px-3 py-1 text-sm ${view === v ? 'bg-accent text-white' : 'bg-card text-fg'}`;

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-4">
          <img src="/icon/512.png" alt="myHistory" className="h-16 w-16" />
          <div className="flex gap-1">
            <button onClick={() => setView('history')} className={tabBtn('history')}>
              历史
            </button>
            <button onClick={() => setView('analytics')} className={tabBtn('analytics')}>
              分析
            </button>
            <button onClick={() => setView('manage')} className={tabBtn('manage')}>
              管理
            </button>
          </div>
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
              {categoryFilter && (
                <button
                  onClick={() => setCategoryFilter('')}
                  className="rounded bg-accent/20 px-2 py-1 text-xs text-accent"
                >
                  类别: {categoryFilter} ✕
                </button>
              )}
              {tagFilter && (
                <button
                  onClick={() => setTagFilter('')}
                  className="rounded bg-accent/20 px-2 py-1 text-xs text-accent"
                >
                  #{tagFilter} ✕
                </button>
              )}
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
              {hasFilter ? `结果：${listVisits?.length ?? 0} 条` : `已选：${selectedDayKey}`}
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
          <aside className="no-scrollbar flex w-1/4 flex-col overflow-y-auto border-l border-border p-4">
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
