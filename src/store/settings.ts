import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_CATEGORY_COLOR,
  CATEGORY_RULES_VERSION,
  type CategoryDef,
} from '../lib/categories';

export interface Settings {
  theme: 'light' | 'dark';
  dotMode: 'dot' | 'heatmap';
  blacklist: string[];
  categories: CategoryDef[];
  categoryVersion?: number;
  locale?: 'zh' | 'en';
  floatingStats?: boolean;
}

const KEY = 'history-plus:settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  dotMode: 'dot',
  blacklist: [],
  categories: DEFAULT_CATEGORIES,
  categoryVersion: CATEGORY_RULES_VERSION,
  floatingStats: true,
};

export async function getSettings(): Promise<Settings> {
  const { [KEY]: stored } = await chrome.storage.local.get(KEY);
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  const storedVersion = (stored as Partial<Settings> | undefined)?.categoryVersion ?? 0;
  const migratePatterns = storedVersion < CATEGORY_RULES_VERSION;
  const current = merged.categories ?? DEFAULT_CATEGORIES;
  const existing = new Set(current.map((c) => c.name));
  const updated = current.map((c) => {
    const def = DEFAULT_CATEGORIES.find((d) => d.name === c.name);
    return {
      ...c,
      patterns: migratePatterns && def ? Array.from(new Set([...def.patterns, ...c.patterns])) : c.patterns,
      icon: c.icon ?? def?.icon ?? DEFAULT_CATEGORY_ICON,
      color: c.color ?? def?.color ?? DEFAULT_CATEGORY_COLOR,
    };
  });
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
