export interface Settings {
  theme: 'light' | 'dark';
  weekStart: 0 | 1; // 0=周日, 1=周一
  dotMode: 'dot' | 'heatmap';
  blacklist: string[];
}

const KEY = 'history-plus:settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  weekStart: 1,
  dotMode: 'dot',
  blacklist: [],
};

export async function getSettings(): Promise<Settings> {
  const { [KEY]: stored } = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ [KEY]: { ...current, ...patch } });
}

export async function getBlacklist(): Promise<string[]> {
  return (await getSettings()).blacklist;
}
