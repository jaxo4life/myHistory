import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_CATEGORY_COLOR,
  type CategoryDef,
} from '../lib/categories';

export interface Settings {
  theme: 'light' | 'dark';
  weekStart: 0 | 1; // 0=周日, 1=周一
  dotMode: 'dot' | 'heatmap';
  blacklist: string[];
  categories: CategoryDef[];
}

const KEY = 'history-plus:settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  weekStart: 1,
  dotMode: 'dot',
  blacklist: [],
  categories: DEFAULT_CATEGORIES,
};

/**
 * 读设置。对旧版存储（无 icon/color）做迁移补全：
 * 按内置同名分类补回 icon/color，避免「全图钉」。统一在此处迁移，
 * 所有读取（CategoryManager、getCategories、采集过滤等）都拿到完整数据。
 */
export async function getSettings(): Promise<Settings> {
  const { [KEY]: stored } = await chrome.storage.local.get(KEY);
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  merged.categories = (merged.categories ?? DEFAULT_CATEGORIES).map((c) => {
    const def = DEFAULT_CATEGORIES.find((d) => d.name === c.name);
    return {
      ...c,
      icon: c.icon ?? def?.icon ?? DEFAULT_CATEGORY_ICON,
      color: c.color ?? def?.color ?? DEFAULT_CATEGORY_COLOR,
    };
  });
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
