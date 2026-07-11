import { useEffect, useState, type ChangeEvent } from 'react';
import { getCategories, saveCategories } from '../store/settings';
import { categoriesToJSON, downloadText, parseCategories, stampedFilename } from '../lib/exporter';
import { Modal } from './Modal';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_CATEGORY_COLOR,
  ICON_LIBRARY,
  COLOR_LIBRARY,
  type CategoryDef,
} from '../lib/categories';
import { useI18n } from '../i18n';

interface FormState {
  name: string;
  icon: string;
  color: string;
  patterns: string;
}

const EMPTY: FormState = { name: '', icon: DEFAULT_CATEGORY_ICON, color: DEFAULT_CATEGORY_COLOR, patterns: '' };

export function CategoryManager() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<CategoryDef[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  if (!categories) return <div className="text-sm text-muted">{t('common.loading')}</div>;

  function beginEdit(cat?: CategoryDef) {
    if (cat) {
      setEditing(cat.name);
      setForm({
        name: cat.name,
        icon: cat.icon ?? DEFAULT_CATEGORY_ICON,
        color: cat.color ?? DEFAULT_CATEGORY_COLOR,
        patterns: cat.patterns.join(', '),
      });
    } else {
      setEditing('__new__');
      setForm(EMPTY);
    }
  }

  async function persist(next: CategoryDef[]) {
    await saveCategories(next);
    setCategories(next);
  }

  async function saveForm() {
    if (!categories) return;
    const name = form.name.trim();
    if (!name) {
      alert(t('catMgr.nameRequired'));
      return;
    }
    const patterns = form.patterns
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const nextCat: CategoryDef = { name, icon: form.icon, color: form.color, patterns };

    let next: CategoryDef[];
    if (editing === '__new__') {
      if (categories.some((c) => c.name === name)) {
        alert(t('catMgr.nameExists'));
        return;
      }
      next = [...categories, nextCat];
    } else {
      next = categories.map((c) => (c.name === editing ? nextCat : c));
    }
    await persist(next);
    setEditing(null);
  }

  function askDelete(name: string) {
    setDeleteTarget(name);
  }

  async function confirmDelete() {
    if (!deleteTarget || !categories) return;
    await persist(categories.filter((c) => c.name !== deleteTarget));
    setDeleteTarget(null);
    setEditing(null);
  }

  async function confirmReset() {
    await persist(DEFAULT_CATEGORIES);
    setResetOpen(false);
    setEditing(null);
  }

  function exportAll() {
    if (!categories) return;
    downloadText(stampedFilename('my-categories', 'json'), categoriesToJSON(categories), 'application/json');
  }

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    if (!categories) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    e.target.value = '';
    const incoming = parseCategories(text);
    if (incoming.length === 0) {
      alert(t('catMgr.importFailed'));
      return;
    }
    const map = new Map(categories.map((c) => [c.name, c]));
    for (const c of incoming) map.set(c.name, c);
    await persist(Array.from(map.values()));
    alert(t('catMgr.importSuccess', { n: incoming.length }));
  }

  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-fg">
          {t('catMgr.title')}{' '}
          <span className="text-xs font-normal text-muted">{t('catMgr.subtitle')}</span>
        </div>
        <button onClick={() => setResetOpen(true)} className="text-xs text-muted hover:text-fg">
          {t('catMgr.reset')}
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {categories.map((cat) => {
          const isActive = editing === cat.name;
          const color = cat.color ?? '#6C5CE7';
          return (
            <div
              key={cat.name}
              onClick={() => beginEdit(cat)}
              role="button"
              tabIndex={0}
              className="group relative flex cursor-pointer flex-col items-center gap-0.5 rounded-lg p-2 transition-opacity hover:opacity-80"
              style={{
                backgroundColor: `${color}${isActive ? '33' : '14'}`,
                boxShadow: isActive ? `0 0 0 2px ${color}` : undefined,
              }}
              title={t('catMgr.cardTitle', { name: cat.name, n: cat.patterns.length })}
            >
              <span className="text-lg leading-none">{cat.icon ?? '📌'}</span>
              <span
                className="w-full truncate text-center text-[11px] leading-tight"
                style={{ color }}
              >
                {cat.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  askDelete(cat.name);
                }}
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-bg text-xs text-muted ring-1 ring-border hover:text-fg group-hover:flex"
                title={t('catMgr.deleteTitle')}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="mt-3 rounded-xl bg-bg p-3 ring-1 ring-border">
          <EditForm
            form={form}
            setForm={setForm}
            isNew={editing === '__new__'}
            onSave={saveForm}
            onDelete={editing !== '__new__' ? () => askDelete(editing!) : undefined}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {editing === null && (
          <button
            onClick={() => beginEdit()}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90"
          >
            {t('catMgr.add')}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="flex cursor-pointer items-center rounded-lg bg-bg px-3 py-1.5 text-sm text-fg ring-1 ring-border transition-colors hover:bg-border">
            {t('catMgr.import')}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onImportFile}
            />
          </label>
          <button
            onClick={exportAll}
            className="rounded-lg bg-bg px-3 py-1.5 text-sm text-fg ring-1 ring-border transition-colors hover:bg-border"
          >
            {t('catMgr.exportAll')}
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="rounded-lg bg-bg px-3 py-1.5 text-sm text-fg ring-1 ring-border transition-colors hover:bg-border"
          >
            {t('catMgr.exportSelected')}
          </button>
        </div>
      </div>

      {exportOpen && categories && (
        <ExportModal categories={categories} onClose={() => setExportOpen(false)} />
      )}

      {deleteTarget && (
        <Modal title={t('catMgr.deleteTitle')} onClose={() => setDeleteTarget(null)}>
          <div className="mb-4 text-sm text-fg">
            {t('catMgr.deleteConfirm', { name: deleteTarget })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded bg-card px-3 py-1 text-sm text-fg"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDelete}
              className="rounded bg-red-500/90 px-3 py-1 text-sm text-white transition-colors hover:bg-red-500"
            >
              {t('catMgr.deleteTitle')}
            </button>
          </div>
        </Modal>
      )}

      {resetOpen && (
        <Modal title={t('catMgr.reset')} onClose={() => setResetOpen(false)}>
          <div className="mb-4 text-sm text-fg">
            {t('catMgr.resetConfirm')}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setResetOpen(false)}
              className="rounded bg-card px-3 py-1 text-sm text-fg"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmReset}
              className="rounded bg-red-500/90 px-3 py-1 text-sm text-white transition-colors hover:bg-red-500"
            >
              {t('catMgr.reset')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditForm({
  form,
  setForm,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  isNew: boolean;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted">
        {isNew ? t('catMgr.addTitle') : t('catMgr.editTitle')}
      </div>

      <div className="flex gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t('catMgr.namePlaceholder')}
          className="min-w-0 flex-1 rounded bg-card px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
          autoFocus
        />
      </div>

      <div className="mt-2 text-xs text-muted">{t('catMgr.icon')}</div>
      <div className="no-scrollbar mt-1 flex max-h-20 flex-wrap gap-1 overflow-y-auto">
        {ICON_LIBRARY.map((ic) => (
          <button
            key={ic}
            onClick={() => setForm({ ...form, icon: ic })}
            className={`rounded p-1 text-lg ${
              form.icon === ic ? 'bg-accent/30 ring-1 ring-accent' : 'hover:bg-card'
            }`}
          >
            {ic}
          </button>
        ))}
      </div>

      <div className="mt-2 text-xs text-muted">{t('catMgr.color')}</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {COLOR_LIBRARY.map((c) => (
          <button
            key={c}
            onClick={() => setForm({ ...form, color: c })}
            className={`h-6 w-6 rounded ${
              form.color === c ? 'ring-2 ring-fg ring-offset-1 ring-offset-bg' : ''
            }`}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>

      <div className="mt-2">
        <input
          value={form.patterns}
          onChange={(e) => setForm({ ...form, patterns: e.target.value })}
          placeholder={t('catMgr.domainPlaceholder')}
          className="w-full rounded bg-card px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
        />
      </div>

      <div className="mt-2 flex gap-2">
        <button
          onClick={onSave}
          className="rounded bg-accent px-3 py-1 text-sm text-white hover:opacity-90"
        >
          {isNew ? t('common.add') : t('common.save')}
        </button>
        <button onClick={onCancel} className="rounded bg-card px-3 py-1 text-sm text-fg">
          {t('common.cancel')}
        </button>
        {!isNew && onDelete && (
          <button
            onClick={onDelete}
            className="ml-auto rounded px-3 py-1 text-sm text-muted hover:text-fg"
          >
            {t('catMgr.deleteTitle')}
          </button>
        )}
      </div>
    </div>
  );
}

function ExportModal({
  categories,
  onClose,
}: {
  categories: CategoryDef[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allOn = categories.length > 0 && selected.size === categories.length;

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function doExport() {
    const list = categories.filter((c) => selected.has(c.name));
    if (list.length === 0) {
      alert(t('catMgr.exportNoneSelected'));
      return;
    }
    downloadText('my-categories.json', categoriesToJSON(list), 'application/json');
    onClose();
  }

  return (
    <Modal title={t('catMgr.exportTitle')} onClose={onClose} wide>
      <div className="mb-2 flex items-center justify-end">
        <button
          onClick={() =>
            setSelected(allOn ? new Set() : new Set(categories.map((c) => c.name)))
          }
          className="text-xs text-muted hover:text-fg"
        >
          {allOn ? t('catMgr.deselectAll') : t('catMgr.selectAll')}
        </button>
      </div>
      <div className="no-scrollbar grid max-h-80 grid-cols-6 gap-1.5 overflow-y-auto">
        {categories.map((cat) => {
          const on = selected.has(cat.name);
          const color = cat.color ?? '#6C5CE7';
          return (
            <div
              key={cat.name}
              onClick={() => toggle(cat.name)}
              role="button"
              tabIndex={0}
              className="relative flex cursor-pointer flex-col items-center gap-0.5 rounded-lg p-2 transition-opacity hover:opacity-80"
              style={{
                backgroundColor: `${color}${on ? '33' : '14'}`,
                boxShadow: on ? `0 0 0 2px ${color}` : undefined,
              }}
            >
              <span className="text-lg leading-none">{cat.icon ?? '📌'}</span>
              <span
                className="w-full truncate text-center text-[11px] leading-tight"
                style={{ color }}
              >
                {cat.name}
              </span>
              {on && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded bg-card px-3 py-1 text-sm text-fg">
          {t('common.cancel')}
        </button>
        <button
          onClick={doExport}
          className="rounded bg-accent px-3 py-1 text-sm text-white hover:opacity-90"
        >
          {t('catMgr.exportBtn')} ({selected.size})
        </button>
      </div>
    </Modal>
  );
}
