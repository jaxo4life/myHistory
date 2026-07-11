import { getDomain, getDayKey } from '../lib/url-utils';
import { shouldRecord } from '../lib/privacy';
import { addVisit } from '../db/queries';
import { getBlacklist } from '../store/settings';

const BACKFILL_FLAG = 'history-plus:backfilled';
const SETTINGS_KEY = 'history-plus:settings';
// 同 tab 同 URL 在此窗口内的重复 onCommitted 视为一次（防 redirect/瞬时重复）
const DEDUP_MS = 1500;

export default defineBackground(() => {
  const recentNavs = new Map<string, number>();
  // blacklist 内存缓存：避免每次 onCommitted 都读 chrome.storage；settings 变化时失效。
  let blacklistCache: string[] | null = null;
  const getBlacklistCached = async (): Promise<string[]> => {
    if (blacklistCache === null) blacklistCache = await getBlacklist();
    return blacklistCache;
  };
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]) blacklistCache = null;
  });

  // 点击扩展图标直接打开历史主界面（无 popup 中转）
  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('/history.html') });
  });

  // 首次安装/更新时回填 Chrome 现存历史（最多 ~90 天）
  chrome.runtime.onInstalled.addListener(() => {
    backfillFromHistory().catch((e) => console.error('[history-plus] backfill failed', e));
  });

  // 监听每次导航提交
  chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return; // 仅主框架

    // 去重：极短时间内同 tab 同 URL 不重复记录
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

    // 一次 tabs.get 同时取 incognito/title/favIconUrl（原三次独立 IPC 调用）
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
