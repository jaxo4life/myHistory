import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_CATEGORY_COLOR,
  CATEGORY_RULES_VERSION,
  type CategoryDef,
} from '../lib/categories';

export interface Settings {
  theme: 'light' | 'dark';
  weekStart: 0 | 1; // 0=周日, 1=周一
  dotMode: 'dot' | 'heatmap';
  blacklist: string[];
  categories: CategoryDef[];
  categoryVersion?: number;
  locale?: 'zh' | 'en';
}

const KEY = 'history-plus:settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  weekStart: 1,
  dotMode: 'dot',
  blacklist: [],
  categories: DEFAULT_CATEGORIES,
  categoryVersion: CATEGORY_RULES_VERSION,
};

/**
 * 读设置。对旧版存储（无 icon/color）做迁移补全：
 * 按内置同名分类补回 icon/color，避免「全图钉」。统一在此处迁移，
 * 所有读取（CategoryManager、getCategories、采集过滤等）都拿到完整数据。
 */
export async function getSettings(): Promise<Settings> {
  const { [KEY]: stored } = await chrome.storage.local.get(KEY);
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  // 分类规则版本迁移：DEFAULT_CATEGORIES.patterns 变更后，把内置分类的 patterns
  // 更新到最新（用户自定义分类保留），并写回 storage 避免每次读取重复迁移。
  const storedVersion = (stored as Partial<Settings> | undefined)?.categoryVersion ?? 0;
  const migratePatterns = storedVersion < CATEGORY_RULES_VERSION;
  const current = merged.categories ?? DEFAULT_CATEGORIES;
  const existing = new Set(current.map((c) => c.name));
  const updated = current.map((c) => {
    const def = DEFAULT_CATEGORIES.find((d) => d.name === c.name);
    return {
      ...c,
      patterns: migratePatterns && def ? def.patterns : c.patterns,
      icon: c.icon ?? def?.icon ?? DEFAULT_CATEGORY_ICON,
      color: c.color ?? def?.color ?? DEFAULT_CATEGORY_COLOR,
    };
  });
  // 追加版本升级新增的内置类（如本次新加的 AI）；用户自定义分类已在 updated 中保留
  const added = migratePatterns
    ? DEFAULT_CATEGORIES.filter((d) => !existing.has(d.name))
    : [];
  merged.categories = [...updated, ...added];
  merged.categoryVersion = CATEGORY_RULES_VERSION;
  if (migratePatterns) {
    await chrome.storage.local.set({ [KEY]: merged });
  }
  return merged;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ [KEY]: { ...current, ...patch } });
}

export async function getBlacklist(): Promise<string[]> {
  return (await getSettings()).blacklist;
}

export async function getCategories(): Promise<CategoryDef[]> {
  return (await getSettings()).categories;
}

export async function saveCategories(categories: CategoryDef[]): Promise<void> {
  await saveSettings({ categories });
}
