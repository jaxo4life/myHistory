import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Visit } from '../types/visit';
import { deleteVisit, updateVisitTags } from '../db/queries';
import { Modal } from './Modal';
import { useI18n, catLabel } from '../i18n';
import { getCategories, saveCategories } from '../store/settings';
import { extractRegistrableDomain } from '../lib/url-utils';
import { classifyDomain, type CategoryDef } from '../lib/categories';

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
  categories?: CategoryDef[];
}

export function HistoryItem({
  visit,
  selected,
  selectionMode,
  onToggleSelect,
  onTagClick,
  categories,
}: ItemProps) {
  const { t } = useI18n();
  const [tagModal, setTagModal] = useState(false);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const tags = visit.tags ?? [];
  const hasTags = tags.length > 0;
  const currentCat = categories ? classifyDomain(visit.domain, categories) : '其他';
  const currentDef = categories?.find((c) => c.name === currentCat);

  function addTags(input: string) {
    const newTags = input
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (newTags.length === 0) return;
    updateVisitTags(visit.id!, [...new Set([...(visit.tags ?? []), ...newTags])]);
  }

  function removeTag(tag: string) {
    updateVisitTags(visit.id!, (visit.tags ?? []).filter((x) => x !== tag));
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
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <a
              href={visit.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-border hover:text-fg"
              title={t('historyItem.openTitle')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <button
              onClick={() => setClassifyOpen(true)}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-lg text-base leading-none transition-colors hover:bg-border"
              title={`${t('historyItem.classifyTitle')}${currentDef ? ' · ' + currentDef.name : ''}`}
            >
              {currentDef ? (
                currentDef.icon
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setTagModal(true)}
              className={`relative rounded-lg p-2 transition-colors ${
                hasTags ? 'text-accent' : 'text-muted hover:text-fg'
              }`}
              title={hasTags ? t('historyItem.tagTitle', { tags: tags.join(', ') }) : t('historyItem.editTagTitle')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              {hasTags && (
                <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-semibold leading-none text-white">
                  {tags.length}
                </span>
              )}
            </button>
            <button
              onClick={() => deleteVisit(visit.id!)}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-border hover:text-red-400"
              title={t('historyItem.deleteTitle')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {hasTags && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {tags.map((tg) => (
            <button
              key={tg}
              onClick={() => onTagClick?.(tg)}
              className="rounded bg-card px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:text-accent"
            >
              #{tg}
            </button>
          ))}
        </div>
      )}

      {tagModal && (
        <Modal title={t('historyItem.tagModal.title')} onClose={() => setTagModal(false)}>
          <TagEditor visit={visit} onAdd={addTags} onRemove={removeTag} />
        </Modal>
      )}

      {classifyOpen && (
        <ClassifyModal domain={visit.domain} onClose={() => setClassifyOpen(false)} />
      )}
    </div>
  );
}

function ClassifyModal({ domain, onClose }: { domain: string; onClose: () => void }) {
  const { t, locale } = useI18n();
  const cats = useLiveQuery(() => getCategories(), []);
  const [saving, setSaving] = useState(false);
  const main = extractRegistrableDomain(domain);
  const [customDomain, setCustomDomain] = useState(main);
  const currentCat = cats ? classifyDomain(domain, cats) : '';

  async function pick(name: string) {
    const target = customDomain.trim() || main;
    setSaving(true);
    const all = await getCategories();
    await saveCategories(
      all.map((c) =>
        c.name === name
          ? { ...c, patterns: Array.from(new Set([...c.patterns, target])) }
          : c,
      ),
    );
    onClose();
  }

  return (
    <Modal title={t('historyItem.classifyTitle')} onClose={onClose} wide>
      <input
        value={customDomain}
        onChange={(e) => setCustomDomain(e.target.value)}
        className="mb-3 w-full rounded-lg bg-card px-3 py-2 text-xs text-fg outline-none ring-1 ring-border focus:ring-accent"
        autoFocus
      />
      <div className="grid grid-cols-5 gap-1.5">
        {(cats ?? []).map((c) => (
          <button
            key={c.name}
            disabled={saving}
            onClick={() => pick(c.name)}
            className={`flex flex-col items-center gap-0.5 rounded-lg p-2 text-xs transition-opacity hover:opacity-80 disabled:opacity-50 ${
              c.name === currentCat ? 'ring-2 ring-accent' : ''
            }`}
            style={{ backgroundColor: `${c.color ?? '#6C5CE7'}14` }}
          >
            <span className="text-lg">{c.icon ?? '📌'}</span>
            <span className="w-full truncate text-center" style={{ color: c.color }}>
              {catLabel(c.name, locale)}
            </span>
          </button>
        ))}
      </div>
    </Modal>
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
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const tags = visit.tags ?? [];

  return (
    <div>
      <div className="mb-3 flex min-h-[2rem] flex-wrap content-start gap-1">
        {tags.length === 0 && <span className="self-center text-xs text-muted">{t('historyItem.tagModal.empty')}</span>}
        {tags.map((tg) => (
          <span
            key={tg}
            className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 text-xs text-fg ring-1 ring-border"
          >
            #{tg}
            <button onClick={() => onRemove(tg)} className="text-muted hover:text-fg" title={t('historyItem.tagModal.removeTitle')}>
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
          placeholder={t('historyItem.tagInput.placeholder')}
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
          {t('common.add')}
        </button>
      </div>
    </div>
  );
}
