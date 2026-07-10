import { useEffect, useState } from 'react';
import { getSettings, saveCategories, type Settings } from '../store/settings';
import {
  DEFAULT_CATEGORIES,
  ICON_LIBRARY,
  COLOR_LIBRARY,
  type CategoryDef,
} from '../lib/categories';

interface FormState {
  name: string;
  icon: string;
  color: string;
  patterns: string; // 文本，逗号/空格分隔
}

const EMPTY: FormState = { name: '', icon: '📌', color: '#6C5CE7', patterns: '' };

/** 分类管理：紧凑小卡片网格 + 点击编辑 + 新增。 */
export function CategoryManager() {
  const [settings, setSettings] = useState<Settings | null>(null);
  // null=浏览态；'__new__'=新增；其他=编辑该名称
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) return <div className="text-sm text-muted">加载中…</div>;

  function beginEdit(cat?: CategoryDef) {
    if (cat) {
      setEditing(cat.name);
      setForm({
        name: cat.name,
        icon: cat.icon ?? '📌',
        color: cat.color ?? '#6C5CE7',
        patterns: cat.patterns.join(', '),
      });
    } else {
      setEditing('__new__');
      setForm(EMPTY);
    }
  }

  async function saveForm() {
    const name = form.name.trim();
    if (!name) {
      alert('请填写分类名');
      return;
    }
    const patterns = form.patterns
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const next: CategoryDef = { name, icon: form.icon, color: form.color, patterns };

    let categories: CategoryDef[];
    if (editing === '__new__') {
      if (settings.categories.some((c) => c.name === name)) {
        alert('该分类名已存在');
        return;
      }
      categories = [...settings.categories, next];
    } else {
      categories = settings.categories.map((c) => (c.name === editing ? next : c));
    }
    await saveCategories(categories);
    setSettings({ ...settings, categories });
    setEditing(null);
  }

  async function remove(name: string) {
    if (!confirm(`删除分类「${name}」？`)) return;
    const categories = settings.categories.filter((c) => c.name !== name);
    await saveCategories(categories);
    setSettings({ ...settings, categories });
    setEditing(null);
  }

  async function reset() {
    if (!confirm('恢复内置默认分类？所有自定义将丢失。')) return;
    await saveCategories(DEFAULT_CATEGORIES);
    setSettings({ ...settings, categories: DEFAULT_CATEGORIES });
    setEditing(null);
  }

  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-fg">
          分类管理 <span className="text-xs font-normal text-muted">（点击卡片编辑）</span>
        </div>
        <button onClick={reset} className="text-xs text-muted hover:text-fg">
          恢复默认
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {settings.categories.map((cat) =>
          editing === cat.name ? (
            <EditForm
              key={cat.name}
              form={form}
              setForm={setForm}
              isNew={false}
              onSave={saveForm}
              onDelete={() => remove(cat.name)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              key={cat.name}
              onClick={() => beginEdit(cat)}
              className="flex flex-col items-center gap-0.5 rounded-lg p-2 transition-opacity hover:opacity-80"
              style={{ backgroundColor: `${cat.color ?? '#6C5CE7'}14` }}
              title={`${cat.name} · ${cat.patterns.length} 条规则 · 点击编辑`}
            >
              <span className="text-lg leading-none">{cat.icon ?? '📌'}</span>
              <span
                className="w-full truncate text-center text-[11px] leading-tight"
                style={{ color: cat.color }}
              >
                {cat.name}
              </span>
            </button>
          ),
        )}

        {editing === '__new__' && (
          <EditForm
            form={form}
            setForm={setForm}
            isNew
            onSave={saveForm}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>

      {editing === null && (
        <button
          onClick={() => beginEdit()}
          className="mt-3 rounded-lg bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90"
        >
          + 添加分类
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
  return (
    <div className="col-span-6 rounded-xl bg-bg p-3 ring-1 ring-border">
      <div className="flex gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="分类名（如：设计）"
          className="min-w-0 flex-1 rounded bg-card px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
          autoFocus
        />
      </div>

      <div className="mt-2 text-xs text-muted">图标</div>
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

      <div className="mt-2 text-xs text-muted">颜色</div>
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
          placeholder="域名，逗号分隔（如 figma.com, dribbble.com）"
          className="w-full rounded bg-card px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
        />
      </div>

      <div className="mt-2 flex gap-2">
        <button
          onClick={onSave}
          className="rounded bg-accent px-3 py-1 text-sm text-white hover:opacity-90"
        >
          {isNew ? '添加' : '保存'}
        </button>
        <button onClick={onCancel} className="rounded bg-card px-3 py-1 text-sm text-fg">
          取消
        </button>
        {!isNew && onDelete && (
          <button
            onClick={onDelete}
            className="ml-auto rounded px-3 py-1 text-sm text-muted hover:text-fg"
          >
            删除分类
          </button>
        )}
      </div>
    </div>
  );
}
