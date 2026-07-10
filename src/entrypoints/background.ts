import { getDomain, getDayKey } from '../lib/url-utils';
import { shouldRecord } from '../lib/privacy';
import { addVisit } from '../db/queries';
import { getBlacklist } from '../store/settings';

const BACKFILL_FLAG = 'history-plus:backfilled';

export default defineBackground(() => {
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

    const incognito = await isIncognito(details.tabId);
    const domain = getDomain(details.url);
    const blacklist = await getBlacklist();

    if (!shouldRecord({ url: details.url, domain, incognito }, blacklist)) return;

    const title = await getTabTitle(details.tabId);
    const faviconUrl = await getTabFavicon(details.tabId);

    await addVisit({
      url: details.url,
      domain,
      title: title || domain,
      visitTime: details.timeStamp,
      dayKey: getDayKey(details.timeStamp),
      transitionType: details.transitionType,
      referrerUrl: undefined,
      faviconUrl,
    });
  });
});

async function isIncognito(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return !!tab.incognito;
  } catch {
    return false;
  }
}

async function getTabTitle(tabId: number): Promise<string> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.title ?? '';
  } catch {
    return '';
  }
}

async function getTabFavicon(tabId: number): Promise<string | undefined> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.favIconUrl;
  } catch {
    return undefined;
  }
}

async function backfillFromHistory(): Promise<void> {
  const { [BACKFILL_FLAG]: done } = await chrome.storage.local.get(BACKFILL_FLAG);
  if (done) return;

  const items = await chrome.history.search({
    text: '',
    startTime: 0,
    maxResults: 10000,
  });

  for (const item of items) {
    if (!item.url || !item.lastVisitTime) continue;
    const domain = getDomain(item.url);
    if (!shouldRecord({ url: item.url, domain, incognito: false }, [])) continue;
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
