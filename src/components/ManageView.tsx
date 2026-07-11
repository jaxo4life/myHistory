import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getOverview, getAllVisits, clearAllVisits } from '../db/queries';
import { visitsToCSV, visitsToJSON, downloadText } from '../lib/exporter';
import { getSettings, saveSettings } from '../store/settings';
import { Modal } from './Modal';
import { CategoryManager } from './CategoryManager';
import { useI18n } from '../i18n';

export function ManageView() {
  const { t } = useI18n();
  const stats = useLiveQuery(() => getOverview(), []);
  const [clearOpen, setClearOpen] = useState(false);
  const [floating, setFloating] = useState(true);

  useEffect(() => {
    getSettings().then((s) => setFloating(s.floatingStats ?? true));
  }, []);

  async function toggleFloating() {
    const next = !floating;
    setFloating(next);
    await saveSettings({ floatingStats: next });
  }

  async function exportAll(format: 'csv' | 'json') {
    const data = await getAllVisits();
    if (format === 'csv') {
      downloadText('history-all.csv', visitsToCSV(data), 'text/csv');
    } else {
      downloadText('history-all.json', visitsToJSON(data), 'application/json');
    }
  }

  async function doClear() {
    await clearAllVisits();
    setClearOpen(false);
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 rounded-2xl bg-card p-5">
          <div className="mb-3 text-sm font-semibold text-fg">{t('manage.data')}</div>
          <div className="mb-4 text-xs text-muted">
            {t('manage.records', { total: stats?.total ?? '…', domains: stats?.domains ?? '…' })}
          </div>

          <div className="mb-4">
            <div className="mb-2 text-xs text-muted">{t('manage.exportAll')}</div>
            <div className="flex gap-2">
              <button
                onClick={() => exportAll('csv')}
                className="rounded bg-accent px-3 py-1.5 text-sm text-white transition-opacity hover:opacity-90"
              >
                {t('manage.exportCsv')}
              </button>
              <button
                onClick={() => exportAll('json')}
                className="rounded bg-bg px-3 py-1.5 text-sm text-fg ring-1 ring-border transition-colors hover:bg-border"
              >
                {t('manage.exportJson')}
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-2 text-xs text-red-400">{t('manage.danger')}</div>
            <button
              onClick={() => setClearOpen(true)}
              className="rounded bg-red-500/90 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-500"
            >
              {t('manage.clearAll')}
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-1 text-sm font-semibold text-fg">{t('manage.floating')}</div>
              <div className="text-xs text-muted">{t('manage.floatingHint')}</div>
            </div>
            <button
              onClick={toggleFloating}
              role="switch"
              aria-checked={floating}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                floating ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  floating ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <CategoryManager />

        {clearOpen && (
          <ClearConfirmModal
            total={stats?.total}
            onClose={() => setClearOpen(false)}
            onConfirm={doClear}
          />
        )}
      </div>
    </div>
  );
}

function ClearConfirmModal({
  total,
  onClose,
  onConfirm,
}: {
  total?: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  const confirmWord = t('manage.clear.confirmWord');
  const [text, setText] = useState('');
  return (
    <Modal title={t('manage.clear.title')} onClose={onClose}>
      <div className="mb-3 text-sm text-fg">
        {t('manage.clear.body', { total: total ?? '…' })}
      </div>
      <div className="mb-2 text-xs text-muted">{t('manage.clear.prompt', { word: confirmWord })}</div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded bg-card px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-red-500"
        autoFocus
      />
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded bg-card px-3 py-1 text-sm text-fg">
          {t('common.cancel')}
        </button>
        <button
          disabled={text !== confirmWord}
          onClick={onConfirm}
          className="rounded bg-red-500 px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          {t('manage.clear.confirmBtn')}
        </button>
      </div>
    </Modal>
  );
}
