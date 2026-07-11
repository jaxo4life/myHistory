export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function getDayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const todayKey = (): string => getDayKey(Date.now());
export const yesterdayKey = (): string => getDayKey(Date.now() - 86_400_000);

const MULTI_PART_TLDS = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
  'com.hk', 'net.hk', 'org.hk', 'com.tw', 'com.sg', 'com.my', 'com.ph',
  'com.vn', 'com.ar', 'com.mx', 'com.au', 'com.br', 'com.pe', 'com.co',
  'com.tr', 'com.gr', 'com.pl', 'com.ru',
  'co.jp', 'co.kr', 'co.in', 'co.id', 'co.th', 'co.nz', 'co.za',
  'eu.org',
]);

export function extractRegistrableDomain(domain: string): string {
  const d = domain.toLowerCase();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(d)) return d;
  const parts = d.split('.');
  if (parts.length <= 2) return d;
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_PART_TLDS.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}
