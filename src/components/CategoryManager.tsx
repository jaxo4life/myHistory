import { useEffect, useState } from 'react';
import { getCategories, saveCategories } from '../store/settings';
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

  async function remove(name: string) {
    if (!confirm(t('catMgr.deleteConfirm', { name }))) return;
    await persist(categories.filter((c) => c.name !== name));
    setEditing(null);
  }

  async function reset() {
    if (!confirm(t('catMgr.resetConfirm'))) return;
    await persist(DEFAULT_CATEGORIES);
    setEditing(null);
  }

  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-fg">
          {t('catMgr.title')}{' '}
          <span className="text-xs font-normal text-muted">{t('catMgr.subtitle')}</span>
        </div>
        <button onClick={reset} className="text-xs text-muted hover:text-fg">
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
                  remove(cat.name);
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
            onDelete={editing !== '__new__' ? () => remove(editing!) : undefined}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {editing === null && (
        <button
          onClick={() => beginEdit()}
          className="mt-3 rounded-lg bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90"
        >
          {t('catMgr.add')}
        </button>
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
