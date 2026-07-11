import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar';
import { HistoryList } from '../../components/HistoryList';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LocaleToggle } from '../../components/LocaleToggle';
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
import { useI18n, catLabel } from '../../i18n';

type View = 'history' | 'analytics' | 'manage';

export function App() {
  const { t, locale } = useI18n();
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

  if (!settings) return <div className="p-4 text-muted">{t('common.loading')}</div>;

  const tabs: { v: View; label: string }[] = [
    { v: 'history', label: t('tab.history') },
    { v: 'analytics', label: t('tab.analytics') },
    { v: 'manage', label: t('tab.manage') },
  ];

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <header className="grid grid-cols-3 items-center border-b border-border px-6">
        <img
          src="/icon/512.png"
          alt="myHistory"
          className="h-16 w-16 justify-self-start"
        />
        <nav className="justify-self-center">
          <div className="flex items-center gap-1 rounded-full bg-card p-1">
            {tabs.map(({ v, label }) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-full px-5 py-1.5 text-base font-medium transition-all ${
                    active ? 'bg-elevated text-fg shadow-sm' : 'text-muted hover:text-fg'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="flex items-center gap-1 justify-self-end">
          <LocaleToggle />
          <ThemeToggle />
        </div>
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
              weekStart={locale === 'zh' ? 1 : 0}
              selectedDayKey={selectedDayKey}
              onSelect={setSelectedDayKey}
            />
            <div className="mt-6">
              <div className="mb-2 text-xs font-medium tracking-wide text-muted">
                {t('sidebar.daySummary')}
              </div>
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
                  placeholder={t('search.placeholder')}
                  className="w-full rounded-lg bg-card py-2 pl-9 pr-3 text-sm text-fg outline-none ring-1 ring-border transition-shadow focus:ring-accent"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {selectionMode ? (
                  <>
                    <span className="text-xs text-muted">
                      {t('search.selected', { n: selectedIds.size })}
                    </span>
                    <button
                      onClick={selectAll}
                      className="rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border"
                    >
                      {t('search.selectAll')}
                    </button>
                    <button
                      onClick={deleteSelected}
                      disabled={selectedIds.size === 0}
                      className="rounded-lg bg-accent px-2.5 py-1 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {t('search.deleteSelected')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="ml-auto rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border"
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                      placeholder={t('search.domainPlaceholder')}
                      className="w-28 rounded-lg bg-card px-2.5 py-1 text-xs text-fg outline-none ring-1 ring-border transition-shadow focus:ring-accent"
                    />
                    {categoryFilter && (
                      <button
                        onClick={() => setCategoryFilter('')}
                        className="rounded-lg bg-accent/15 px-2 py-1 text-xs text-accent transition-colors hover:bg-accent/25"
                      >
                        {t('search.categoryFilter', { name: catLabel(categoryFilter, locale) })}
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
                        {t('search.resultCount', { n: listVisits?.length ?? 0 })}
                      </span>
                    )}
                    <button
                      onClick={() => setSelectionMode(true)}
                      className="ml-auto rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border"
                    >
                      {t('search.selectMode')}
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
            <div className="mb-1 text-sm font-semibold text-fg">{t('sidebar.categories')}</div>
            <CategoryStats onPick={setCategoryFilter} version={settingsVersion} />
            <div className="mb-1 mt-4 text-sm font-semibold text-fg">{t('sidebar.tags')}</div>
            <TagStats onPick={setTagFilter} version={settingsVersion} />
            <div className="mb-1 mt-4 text-sm font-semibold text-fg">
              {t('sidebar.topDomains')}
            </div>
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
