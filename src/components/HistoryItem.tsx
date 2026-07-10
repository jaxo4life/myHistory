import { useState } from 'react';
import type { Visit } from '../types/visit';
import { deleteVisit, updateVisitTags } from '../db/queries';
import { Modal } from './Modal';

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface ItemProps {
  visit: Visit;
  selected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (id: number) => void;
  onTagClick?: (tag: string) => void;
}

export function HistoryItem({
  visit,
  selected,
  selectionMode,
  onToggleSelect,
  onTagClick,
}: ItemProps) {
  const [tagModal, setTagModal] = useState(false);
  const tags = visit.tags ?? [];
  const hasTags = tags.length > 0;

  function addTags(input: string) {
    const newTags = input
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (newTags.length === 0) return;
    updateVisitTags(visit.id!, [...new Set([...(visit.tags ?? []), ...newTags])]);
  }

  function removeTag(tag: string) {
    updateVisitTags(visit.id!, (visit.tags ?? []).filter((t) => t !== tag));
  }

  return (
    <div
      className={`group flex flex-col transition-colors ${
        selected ? 'bg-accent/10' : 'hover:bg-card'
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        {selectionMode && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(visit.id!)}
            className="h-4 w-4 shrink-0 accent-accent"
          />
        )}
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
          {formatTime(visit.visitTime)}
        </span>
        {visit.faviconUrl ? (
          <img src={visit.faviconUrl} alt="" className="h-4 w-4 shrink-0 rounded-sm" />
        ) : (
          <span className="h-4 w-4 shrink-0 rounded-sm bg-card" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-fg">{visit.title}</div>
          <div className="truncate text-xs text-muted">{visit.domain}</div>
        </div>
        {!selectionMode && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <a
              href={visit.url}
              target="_blank"
              rel="noreferrer"
              className="rounded p-1 text-muted transition-colors hover:bg-border hover:text-fg"
              title="打开"
            >
              ↗
            </a>
            <button
              onClick={() => setTagModal(true)}
              className={`rounded p-1 transition-colors ${
                hasTags ? 'text-accent' : 'text-muted hover:text-fg'
              }`}
              title={hasTags ? `标签：${tags.join(', ')}` : '编辑标签'}
            >
              {hasTags ? `#${tags.length}` : '#'}
            </button>
            <button
              onClick={() => deleteVisit(visit.id!)}
              className="rounded p-1 text-muted transition-colors hover:bg-border hover:text-red-400"
              title="删除"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {hasTags && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => onTagClick?.(t)}
              className="rounded bg-card px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:text-accent"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {tagModal && (
        <Modal title="编辑标签" onClose={() => setTagModal(false)}>
          <TagEditor visit={visit} onAdd={addTags} onRemove={removeTag} />
        </Modal>
      )}
    </div>
  );
}

function TagEditor({
  visit,
  onAdd,
  onRemove,
}: {
  visit: Visit;
  onAdd: (input: string) => void;
  onRemove: (tag: string) => void;
}) {
  const [input, setInput] = useState('');
  const tags = visit.tags ?? [];

  return (
    <div>
      <div className="mb-3 flex min-h-[2rem] flex-wrap content-start gap-1">
        {tags.length === 0 && <span className="self-center text-xs text-muted">暂无标签</span>}
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 text-xs text-fg ring-1 ring-border"
          >
            #{t}
            <button onClick={() => onRemove(t)} className="text-muted hover:text-fg" title="移除">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd(input);
              setInput('');
            }
          }}
          placeholder="输入标签，回车添加（逗号分隔多个）"
          className="min-w-0 flex-1 rounded bg-card px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
          autoFocus
        />
        <button
          onClick={() => {
            onAdd(input);
            setInput('');
          }}
          className="rounded bg-accent px-3 py-1 text-sm text-white transition-opacity hover:opacity-90"
        >
          添加
        </button>
      </div>
    </div>
  );
}
