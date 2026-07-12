import { useEffect, useDeferredValue, useState } from 'react';
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
import { Modal } from '../../components/Modal';
import { getByDayKey, searchVisits, deleteVisits } from '../../db/queries';
import { todayKey, dayKeyToRange } from '../../lib/url-utils';
import { visitsToCSV, visitsToJSON, downloadText, stampedFilename } from '../../lib/exporter';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, type Settings } from '../../store/settings';
import { useSettingsVersion } from '../../store/useSettingsVersion';
import { useI18n, catLabel } from '../../i18n';

type View = 'history' | 'analytics' | 'manage';

const APP_VERSION = chrome.runtime.getManifest().version;

export function App() {
  const { t, locale } = useI18n();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [view, setView] = useState<View>('history');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(todayKey());
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const settingsVersion = useSettingsVersion();

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const hasFilter =
    searchQuery.trim() !== '' || domainFilter.trim() !== '' || categoryFilter !== '' || tagFilter !== '';
  const deferredQuery = useDeferredValue(searchQuery);
  const listVisits = useLiveQuery(
    async () => {
      if (!hasFilter && selectedDayKey) {
        return getByDayKey(selectedDayKey);
      }
      return searchVisits({
        query: deferredQuery,
        domain: domainFilter,
        category: categoryFilter,
        tag: tagFilter,
        ...(selectedDayKey ? dayKeyToRange(selectedDayKey) : {}),
      });
    },
    [deferredQuery, domainFilter, categoryFilter, tagFilter, selectedDayKey, settingsVersion],
  );

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function deleteSelected() {
    if (selectedIds.size === 0) return;
    setConfirmDelete(true);
  }

  async function doDeleteSelected() {
    await deleteVisits([...selectedIds]);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setConfirmDelete(false);
  }

  function exportCurrent(format: 'csv' | 'json') {
    const data = listVisits ?? [];
    if (data.length === 0) return;
    const content = format === 'csv' ? visitsToCSV(data) : visitsToJSON(data);
    downloadText(
      stampedFilename('history', format),
      content,
      format === 'csv' ? 'text/csv' : 'application/json',
    );
    setExportOpen(false);
  }

  function pickCategory(c: string) {
    setCategoryFilter(c);
    setSelectedDayKey(null);
  }
  function pickTag(tg: string) {
    setTagFilter(tg);
    setSelectedDayKey(null);
  }
  function pickDomain(d: string) {
    setDomainFilter(d);
    setSelectedDayKey(null);
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
        <div className="flex items-center gap-2 justify-self-end">
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
          <aside className="flex w-72 shrink-0 flex-col p-5">
            <Calendar
              weekStart={locale === 'zh' ? 1 : 0}
              selectedDayKey={selectedDayKey}
              onSelect={setSelectedDayKey}
              filters={{ query: deferredQuery, domain: domainFilter, category: categoryFilter, tag: tagFilter }}
            />
            {selectedDayKey && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-medium tracking-wide text-muted">
                  {t('sidebar.daySummary')}
                </div>
                <DaySummary dayKey={selectedDayKey} />
              </div>
            )}
            <div className="mt-auto pt-4 text-center text-xs text-muted">
              myHistory v{APP_VERSION}
            </div>
          </aside>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedDayKey(null);
                  }}
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
                    {domainFilter && (
                      <button
                        onClick={() => setDomainFilter('')}
                        className="rounded-lg bg-accent/15 px-2 py-1 text-xs text-accent transition-colors hover:bg-accent/25"
                      >
                        {domainFilter} ✕
                      </button>
                    )}
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
                    {(hasFilter || selectedDayKey === null) && (
                      <span className="text-xs text-muted">
                        {t('search.resultCount', { n: listVisits?.length ?? 0 })}
                      </span>
                    )}
                    <button
                      onClick={() => setExportOpen(true)}
                      disabled={(listVisits ?? []).length === 0}
                      className="ml-auto rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border disabled:opacity-40"
                    >
                      {t('search.export')}
                    </button>
                    <button
                      onClick={() => setSelectionMode(true)}
                      className="rounded-lg bg-card px-2.5 py-1 text-xs text-fg transition-colors hover:bg-border"
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
              onTagClick={pickTag}
              settingsVersion={settingsVersion}
            />
          </main>
          <aside className="no-scrollbar flex w-[300px] shrink-0 flex-col overflow-y-auto p-5">
            <div className="mb-1 text-sm font-semibold text-fg">{t('sidebar.categories')}</div>
            <CategoryStats onPick={pickCategory} version={settingsVersion} />
            <div className="mb-1 mt-4 text-sm font-semibold text-fg">{t('sidebar.tags')}</div>
            <TagStats onPick={pickTag} version={settingsVersion} />
            <div className="mb-1 mt-4 text-sm font-semibold text-fg">
              {t('sidebar.topDomains')}
            </div>
            <div className="flex-1">
              <DomainStats onPick={pickDomain} limit={10} />
            </div>
          </aside>
        </div>
      )}

      {confirmDelete && (
        <Modal title={t('search.deleteConfirm.title')} onClose={() => setConfirmDelete(false)}>
          <div className="mb-4 text-sm text-fg">
            {t('search.deleteConfirm.body', { n: selectedIds.size })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded bg-card px-3 py-1 text-sm text-fg"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={doDeleteSelected}
              className="rounded bg-red-500 px-3 py-1 text-sm text-white transition-opacity hover:opacity-90"
            >
              {t('search.deleteConfirm.confirmBtn')}
            </button>
          </div>
        </Modal>
      )}

      {exportOpen && (
        <Modal title={t('search.exportTitle')} onClose={() => setExportOpen(false)}>
          <div className="mb-4 text-sm text-fg">
            {t('search.exportCount', { n: (listVisits ?? []).length })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setExportOpen(false)}
              className="rounded bg-card px-3 py-1 text-sm text-fg"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => exportCurrent('csv')}
              className="rounded bg-accent px-3 py-1 text-sm text-white transition-opacity hover:opacity-90"
            >
              {t('manage.exportCsv')}
            </button>
            <button
              onClick={() => exportCurrent('json')}
              className="rounded bg-bg px-3 py-1 text-sm text-fg ring-1 ring-border transition-colors hover:bg-border"
            >
              {t('manage.exportJson')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
