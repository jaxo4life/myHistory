const INTERNAL_PREFIXES = [
  'chrome://',
  'chrome-search://',
  'chrome-extension://',
  'edge://',
  'extension://',
  'moz-extension://',
  'about:',
  'view-source:',
  'file://',
  'devtools://',
];

/** 是否为浏览器内部页 / 本地文件 / 扩展页 —— 一律不记录。 */
export function isInternalUrl(url: string): boolean {
  return INTERNAL_PREFIXES.some((p) => url.startsWith(p));
}

export interface RecordableVisit {
  url: string;
  domain: string;
  incognito: boolean;
}

/**
 * 判断一次访问是否应被记录。默认锁死的隐私边界：
 * 隐身模式、内部/本地页、空域名、用户黑名单域名 → 不记录。
 */
export function shouldRecord(visit: RecordableVisit, blacklist: string[]): boolean {
  if (visit.incognito) return false;
  if (isInternalUrl(visit.url)) return false;
  if (!visit.domain) return false;
  if (isBlacklisted(visit.domain, blacklist)) return false;
  return true;
}

function isBlacklisted(domain: string, blacklist: string[]): boolean {
  return blacklist.some((b) => b && (domain === b || domain.endsWith('.' + b)));
}
