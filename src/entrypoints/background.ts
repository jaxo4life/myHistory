import { getDomain, getDayKey } from '../lib/url-utils';
import { shouldRecord } from '../lib/privacy';
import { addVisit } from '../db/queries';
import { getBlacklist } from '../store/settings';

const BACKFILL_FLAG = 'history-plus:backfilled';
const SETTINGS_KEY = 'history-plus:settings';
const DEDUP_MS = 1500;

export default defineBackground(() => {
  const recentNavs = new Map<string, number>();
  let blacklistCache: string[] | null = null;
  const getBlacklistCached = async (): Promise<string[]> => {
    if (blacklistCache === null) blacklistCache = await getBlacklist();
    return blacklistCache;
  };
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]) blacklistCache = null;
  });

  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('/history.html') });
  });

  chrome.runtime.onInstalled.addListener(() => {
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
