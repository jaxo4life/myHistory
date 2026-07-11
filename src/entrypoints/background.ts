import { getDomain, getDayKey } from '../lib/url-utils';
import { shouldRecord } from '../lib/privacy';
import { addVisit, getTodayCount, getDomainCount, getTodayTopCategory } from '../db/queries';
import { getBlacklist, getSettings, saveSettings } from '../store/settings';
import { catLabel } from '../i18n/categories';

const BACKFILL_FLAG = 'history-plus:backfilled';
const SETTINGS_KEY = 'history-plus:settings';
const DEDUP_MS = 1500;

export default defineBackground(() => {
  const FLOAT_TTL = 5000;
  let floatGlobal: {
    todayCount: number;
    topCategory: { name: string; icon: string; color: string } | null;
    locale: 'zh' | 'en';
    at: number;
  } | null = null;
  const floatDomain = new Map<string, { count: number; at: number }>();

  function invalidateFloatGlobal() {
    floatGlobal = null;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'FLOATING_STATS') {
      handleFloatingStats(typeof msg.domain === 'string' ? msg.domain : '').then(sendResponse);
      return true;
    }
    return false;
  });

  async function handleFloatingStats(domain: string): Promise<
    | {
        todayCount: number;
        siteCount: number;
        topCategory: { name: string; icon: string; color: string } | null;
        locale: 'zh' | 'en';
      }
    | { error: true }
  > {
    const now = Date.now();
    try {
      let todayCount: number;
      let topCategory: { name: string; icon: string; color: string } | null;
      let locale: 'zh' | 'en';
      if (floatGlobal && now - floatGlobal.at < FLOAT_TTL) {
        todayCount = floatGlobal.todayCount;
        topCategory = floatGlobal.topCategory;
        locale = floatGlobal.locale;
      } else {
        const settings = await getSettings();
        const rules = settings.categories;
        locale = settings.locale ?? 'zh';
        const [tc, cat] = await Promise.all([getTodayCount(), getTodayTopCategory(rules)]);
        todayCount = tc;
        topCategory = cat ? { ...cat, name: catLabel(cat.name, locale) } : null;
        floatGlobal = { todayCount, topCategory, locale, at: now };
      }

      let siteCount: number;
      const dc = floatDomain.get(domain);
      if (dc && now - dc.at < FLOAT_TTL) {
        siteCount = dc.count;
      } else {
        siteCount = await getDomainCount(domain);
        floatDomain.set(domain, { count: siteCount, at: now });
      }
      return { todayCount, siteCount, topCategory, locale };
    } catch {
      return { error: true };
    }
  }

  const recentNavs = new Map<string, number>();
  let blacklistCache: string[] | null = null;
  const getBlacklistCached = async (): Promise<string[]> => {
    if (blacklistCache === null) blacklistCache = await getBlacklist();
    return blacklistCache;
  };
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]) {
      blacklistCache = null;
      invalidateFloatGlobal();
    }
  });

  const MENU_ID = 'toggle-floating-stats';
  const MENU_TITLE: Record<'zh' | 'en', { hide: string; show: string }> = {
    zh: { hide: '隐藏此网站的悬浮窗', show: '显示此网站的悬浮窗' },
    en: { hide: 'Hide on this site', show: 'Show on this site' },
  };
  const refreshMenu = () => {
    const cm = chrome.contextMenus as typeof chrome.contextMenus & { refresh?: () => void };
    cm.refresh?.();
  };

  const cmDyn = chrome.contextMenus as typeof chrome.contextMenus & {
    onShown?: chrome.events.Event<
      (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => void
    >;
  };

  async function updateMenuFor(domain: string) {
    const s = await getSettings();
    const hidden = (s.hiddenSites ?? []).includes(domain);
    const locale = s.locale ?? 'zh';
    chrome.contextMenus.update(MENU_ID, {
      title: hidden ? MENU_TITLE[locale].show : MENU_TITLE[locale].hide,
    });
  }

  cmDyn.onShown?.addListener((info, tab) => {
    const url = tab?.url || info.pageUrl;
    if (!url) return;
    try {
      void updateMenuFor(new URL(url).hostname).then(refreshMenu);
    } catch {
    }
  });

  chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== MENU_ID || !info.pageUrl) return;
    try {
      const domain = new URL(info.pageUrl).hostname;
      const s = await getSettings();
      const list = new Set(s.hiddenSites ?? []);
      if (list.has(domain)) list.delete(domain);
      else list.add(domain);
      await saveSettings({ hiddenSites: Array.from(list) });
    } catch {
    }
  });

  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('/history.html') });
  });

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({ id: MENU_ID, title: '悬浮统计窗', contexts: ['all'] });
    });
    backfillFromHistory().catch((e) => console.error('[history-plus] backfill failed', e));
  });

  chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;

    const navKey = `${details.tabId}:${details.url}`;
    const now = Date.now();
    const last = recentNavs.get(navKey);
    if (last && now - last < DEDUP_MS) {
      recentNavs.set(navKey, now);
      return;
    }
    recentNavs.set(navKey, now);
    if (recentNavs.size > 500) {
      for (const [k, t] of recentNavs) {
        if (now - t > DEDUP_MS * 10) recentNavs.delete(k);
      }
    }

    const tab = await chrome.tabs.get(details.tabId).catch(() => null);
    const incognito = !!tab?.incognito;
    const domain = getDomain(details.url);
    const blacklist = await getBlacklistCached();

    if (!shouldRecord({ url: details.url, domain, incognito }, blacklist)) return;

    await addVisit({
      url: details.url,
      domain,
      title: tab?.title || domain,
      visitTime: details.timeStamp,
      dayKey: getDayKey(details.timeStamp),
      transitionType: details.transitionType,
      referrerUrl: undefined,
      faviconUrl: tab?.favIconUrl,
    });
    invalidateFloatGlobal();
  });
});

async function backfillFromHistory(): Promise<void> {
  const { [BACKFILL_FLAG]: done } = await chrome.storage.local.get(BACKFILL_FLAG);
  if (done) return;

  const blacklist = await getBlacklist();
  const items = await chrome.history.search({
    text: '',
    startTime: 0,
    maxResults: 10000,
  });

  for (const item of items) {
    if (!item.url || !item.lastVisitTime) continue;
    const domain = getDomain(item.url);
    if (!shouldRecord({ url: item.url, domain, incognito: false }, blacklist)) continue;
    await addVisit({
      url: item.url,
      domain,
      title: item.title || domain,
      visitTime: item.lastVisitTime,
      dayKey: getDayKey(item.lastVisitTime),
      transitionType: 'link',
      faviconUrl: undefined,
    });
  }

  await chrome.storage.local.set({ [BACKFILL_FLAG]: true });
}
