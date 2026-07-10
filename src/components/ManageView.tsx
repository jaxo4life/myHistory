import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getOverview, getAllVisits, clearAllVisits } from '../db/queries';
import { visitsToCSV, visitsToJSON, downloadText } from '../lib/exporter';
import { Modal } from './Modal';
import { CategoryManager } from './CategoryManager';

const CONFIRM_TEXT = '清空';

export function ManageView() {
  const stats = useLiveQuery(() => getOverview(), []);
  const [clearOpen, setClearOpen] = useState(false);

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
      {/* 数据管理 */}
      <div className="mb-6 rounded-2xl bg-card p-5">
        <div className="mb-3 text-sm font-semibold text-fg">数据</div>
        <div className="mb-4 text-xs text-muted">
          共 {stats?.total ?? '…'} 条记录 · {stats?.domains ?? '…'} 个域名
        </div>

        <div className="mb-4">
          <div className="mb-2 text-xs text-muted">导出全部历史</div>
          <div className="flex gap-2">
            <button
              onClick={() => exportAll('csv')}
              className="rounded bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              导出 CSV
            </button>
            <button
              onClick={() => exportAll('json')}
              className="rounded bg-card px-3 py-1.5 text-sm text-fg hover:bg-border"
            >
              导出 JSON
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-2 text-xs text-red-400">危险区</div>
          <button
            onClick={() => setClearOpen(true)}
            className="rounded bg-red-500/90 px-3 py-1.5 text-sm text-white hover:bg-red-500"
          >
            清空全部历史
          </button>
        </div>
      </div>

      {/* 分类管理 */}
      <CategoryManager />

      {clearOpen && (
        <ClearConfirmModal
          total={stats?.total}
          onClose={() => setClearOpen(false)}
          onConfirm={doClear}
        />
      )}
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
  const [text, setText] = useState('');
  return (
    <Modal title="清空全部历史" onClose={onClose}>
      <div className="mb-3 text-sm text-fg">
        即将永久删除全部 <span className="font-bold">{total ?? '…'}</span> 条历史记录。
      </div>
      <div className="mb-2 text-xs text-muted">
        此操作不可撤销。请输入「<span className="text-fg">{CONFIRM_TEXT}</span>」以确认：
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded bg-card px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-red-500"
        autoFocus
      />
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded bg-card px-3 py-1 text-sm text-fg">
          取消
        </button>
        <button
          disabled={text !== CONFIRM_TEXT}
          onClick={onConfirm}
          className="rounded bg-red-500 px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          确认清空
        </button>
      </div>
    </Modal>
  );
}
