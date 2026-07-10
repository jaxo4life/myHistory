import { useEffect, useState } from 'react';
import { getSettings, saveCategories, type Settings } from '../store/settings';
import { DEFAULT_CATEGORIES } from '../lib/categories';

/** 分类管理：增删自定义分类与域名规则，持久化到 chrome.storage。 */
export function CategoryManager() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [newName, setNewName] = useState('');
  const [newPatterns, setNewPatterns] = useState('');

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) return <div className="text-sm text-muted">加载中…</div>;

  async function addCategory() {
    const name = newName.trim();
    if (!name) return;
    if (settings.categories.some((c) => c.name === name)) {
      alert('该分类已存在');
      return;
    }
    const patterns = newPatterns
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const categories = [...settings.categories, { name, patterns }];
    await saveCategories(categories);
    setSettings({ ...settings, categories });
    setNewName('');
    setNewPatterns('');
  }

  async function removeCategory(name: string) {
    const categories = settings.categories.filter((c) => c.name !== name);
    await saveCategories(categories);
    setSettings({ ...settings, categories });
  }

  async function resetCategories() {
    if (!confirm('恢复内置默认分类？自定义分类将丢失。')) return;
    await saveCategories(DEFAULT_CATEGORIES);
    setSettings({ ...settings, categories: DEFAULT_CATEGORIES });
  }

  return (
    <div className="rounded bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-fg">分类管理</div>
        <button onClick={resetCategories} className="text-xs text-muted hover:text-fg">
          恢复默认
        </button>
      </div>
      <div className="mb-3 flex flex-col gap-1">
        {settings.categories.map((c) => (
          <div key={c.name} className="flex items-center justify-between text-sm">
            <span className="truncate text-fg">
              {c.name}
              <span className="ml-2 text-xs text-muted">{c.patterns.length} 规则</span>
            </span>
            <button
              onClick={() => removeCategory(c.name)}
              className="shrink-0 text-muted hover:text-fg"
              title="删除该分类"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新分类名（如：设计）"
          className="rounded bg-bg px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
        />
        <input
          value={newPatterns}
          onChange={(e) => setNewPatterns(e.target.value)}
          placeholder="域名，逗号分隔（如 figma.com, dribbble.com）"
          className="rounded bg-bg px-2 py-1 text-sm text-fg outline-none ring-1 ring-border focus:ring-accent"
        />
        <button
          onClick={addCategory}
          className="rounded bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          添加分类
        </button>
      </div>
    </div>
  );
}
