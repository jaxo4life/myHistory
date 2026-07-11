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

export function isInternalUrl(url: string): boolean {
  return INTERNAL_PREFIXES.some((p) => url.startsWith(p));
}

export interface RecordableVisit {
  url: string;
  domain: string;
  incognito: boolean;
}

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
