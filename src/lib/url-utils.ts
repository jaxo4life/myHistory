/** 从 URL 提取域名（hostname）。解析失败返回空串。 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/** 把毫秒时间戳转成本地时区的 'YYYY-MM-DD'。 */
export function getDayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 今天 / 昨天的 dayKey（本地时区）。 */
export const todayKey = (): string => getDayKey(Date.now());
export const yesterdayKey = (): string => getDayKey(Date.now() - 86_400_000);
